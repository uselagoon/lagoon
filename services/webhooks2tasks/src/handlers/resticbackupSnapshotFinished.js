// @flow

const moment = require('moment');

const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { logger } = require('@lagoon/commons/src/local-logging');
const {
  addBackup,
  getEnvironmentByOpenshiftProjectName
} = require('@lagoon/commons/src/api');
const R = require('ramda');

import type { WebhookRequestData } from '../types';

// TODO: Use this function and uncomment section in webhook-handler when single backup
// webhooks have all the needed data.
// async function resticbackupSnapshotFinishedNew(webhook: WebhookRequestData) {
//   const { webhooktype, event, uuid, body } = webhook;

//   try {
//     const { name, bucket_name, backup_metrics } = body;
//     const environmentResult = await getEnvironmentByOpenshiftProjectName(bucket_name);
//     const environment = R.prop('environmentByOpenshiftProjectName', environmentResult)

//     if (!environment) {
//       logger.warn(`Skipping ${webhooktype}:${event}. Error: environment ${bucket_name} not found.`);
//       return;
//     }

//     const backupId = R.prop('id', backup_metrics);
//     // mariadb expects a specific timeformat of 'YYYY-MM-DD HH:mm:ss'
//     const created = R.ifElse(
//       R.propSatisfies(timestamp => timestamp == 0, 'backup_end_timestamp'),
//       R.always(moment().format(
//         'YYYY-MM-DD HH:mm:ss'
//       )),
//       R.always(moment(R.prop('backup_end_timestamp', backup_metrics)).format(
//         'YYYY-MM-DD HH:mm:ss'
//       ))
//     )(backup_metrics);

//     let source;
//     const mountedPvc = R.path(['mounted_PVCs', 0], backup_metrics);
//     const folderName = R.pipe(
//       R.prop('Folder'),
//       R.replace(`${name}-`, ''),
//       R.replace('-prebackuppod', ''),
//     )(backup_metrics);

//     if (mountedPvc) {
//       source = mountedPvc;
//     } else if (folderName) {
//       source = folderName;
//     } else {
//       source = 'unknown';
//     }

//     await addBackup(null, environment.id, source, backupId, created);

//     return;
//   } catch (error) {
//     sendToLagoonLogs(
//       'error',
//       '',
//       uuid,
//       `${webhooktype}:${event}:error`,
//       {
//         data: body
//       },
//       `Could not sync snapshots, reason: ${error}`
//     );

//     return;
//   }
// }

async function resticbackupSnapshotFinished(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const { name, bucket_name, snapshots } = body;
    const environmentResult = await getEnvironmentByOpenshiftProjectName(bucket_name);
    const environment = R.prop('environmentByOpenshiftProjectName', environmentResult)

    if (!environment) {
      logger.warn(`Skipping ${webhooktype}:${event}. Error: environment ${bucket_name} not found.`);
      return;
    }

    const snapshot = R.prop(0, snapshots);
    if (!snapshot) {
      logger.warn(`Skipping ${webhooktype}:${event}. Error: no snapshot data.`);
      return;
    }

    const backupId = R.prop('id', snapshot);
    // mariadb expects a specific timeformat of 'YYYY-MM-DD HH:mm:ss'
    const created = moment(R.prop('time', snapshot)).format(
      'YYYY-MM-DD HH:mm:ss'
    );

    // Determine source from the snapshot path.
    // 1: `/data/*` --> means this is a PVC we use whatever is after `/data/` as the name of the backup
    // 2: `*.tar` or `*.sql` --> current implementation with the name of the backup right before the ending, for example: foo.bar.tar (the backup is called `bar`)
    let source;
    const paths = R.prop('paths', snapshot);
    const pattern = /^\/data\/([\w-]+)|([\w-]+).(?:sql|tar)$/;
    if (R.isEmpty(paths)) {
      source = 'unknown';
    } else {
      const path = R.head(paths);
      if (!R.test(pattern, path)) {
        source = 'unknown';
      } else {
        const matches = R.match(pattern, path);
        if (R.prop(1, matches)) {
          source = R.prop(1, matches);
        } else if (R.prop(2, matches)) {
          source = R.prop(2, matches);
        } else {
          source = 'unknown';
        }
      }
    }

    await addBackup(null, environment.id, source, backupId, created);

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
