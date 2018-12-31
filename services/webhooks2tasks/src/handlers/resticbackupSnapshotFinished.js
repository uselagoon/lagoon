// @flow

const moment = require('moment');

const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const {
  addBackup,
  getAllEnvironmentBackups
} = require('@lagoon/commons/src/api');
const R = require('ramda');

import type { WebhookRequestData } from '../types';

const saveSnapshotAsBackup = async (snapshot, environmentId) => {
  const hostname = R.prop('hostname', snapshot);
  const backupId = R.prop('id', snapshot);
  // mariadb expects a specific timeformat of 'YYYY-MM-DD HH:mm:ss'
  const created = moment(R.prop('time', snapshot)).format(
    'YYYY-MM-DD HH:mm:ss'
  );

  // Determine source from the snapshot path.
  // 1: `stdin` anywhere in the string --> which means it's a mysql backup (loaded from the stdin)
  // 2: `/data/*` --> means this is a PVC we use whatever is after `/data/` as the name of the backup
  // 3: `*.tar` or `*.sql` --> current implementation with the name of the backup right before the ending, for example: foo.bar.tar (the backup is called `bar`)
  // 4: anything with `-cli-` but NOT `.tar` or `.sql` endings (as already catched by Nr 3) --> again just a mysql backup
  let source;
  const paths = R.prop('paths', snapshot);
  const pattern = /(stdin)|^\/data\/.([\w-]+)|([\w-]+).(?:sql|tar)|(cli).*(?<!tar|sql)$/;
  if (R.isEmpty(paths)) {
    source = 'unknown';
  } else {
    const path = R.head(paths);
    if (!R.test(pattern, path)) {
      source = 'unknown';
    } else {
      const matches = R.match(pattern, path);
      if (R.prop(1, matches)) {
        source = 'mysql';
      } else if (R.prop(2, matches)) {
        source = R.prop(2, matches);
      } else if (R.prop(3, matches)) {
        source = R.prop(3, matches);
      } else if (R.prop(4, matches)) {
        source = 'mysql';
      } else {
        source = 'unknown';
      }
    }
  }

  return addBackup(null, environmentId, source, backupId, created);
};

async function resticbackupSnapshotFinished(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    // Get a list of all environments and their existing backups.
    const allEnvironmentsResult = await getAllEnvironmentBackups();
    const allEnvironments = R.prop('allEnvironments', allEnvironmentsResult)
    const existingBackupIds = R.pipe(
      R.map(env => env.backups),
      R.flatten(),
      R.map(backup => backup.backupId)
    )(allEnvironments);

    // The webhook contains all existing and new snapshots made for all
    // environments. Filter out snapshots that have already been recorded and
    // group remaining (new) by hostname.
    const incomingSnapshots = R.prop('snapshots', body);
    const newSnapshots = R.pipe(
      R.reject(snapshot => R.contains(snapshot.id, existingBackupIds)),
      // Remove pod names suffix from hostnames.
      R.map(R.over(R.lensProp('hostname'), R.replace(/(-cli|-mariadb|-nginx|-solr|-node|-elasticsearch|-redis)$/, ''))),
      R.groupBy(snapshot => snapshot.hostname),
      R.toPairs()
    )(incomingSnapshots);

    for (const [hostname, snapshots] of newSnapshots) {
      const environment = R.find(R.propEq('openshiftProjectName', hostname), allEnvironments);

      if (!environment) {
        continue;
      }

      for (const snapshot of snapshots) {
        try {
          const newBackupResult = await saveSnapshotAsBackup(
            snapshot,
            environment.id
          );
          const newBackup = R.prop('addBackup', newBackupResult);
          const meta = {
            data: newBackup,
            backupId: newBackup.backupId,
            project: environment.project.name,
            source: newBackup.source
          };
        } catch (error) {
          // No error logging for now
        }
      }
    }

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:error`,
      {
        data: body
      },
      `Could not sync snapshots, reason: ${error}`
    );

    return;
  }
}

module.exports = resticbackupSnapshotFinished;
