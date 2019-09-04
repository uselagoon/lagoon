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

async function resticbackupSnapshotFinished(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const { name, bucket_name, backup_metrics } = body;
    const environmentResult = await getEnvironmentByOpenshiftProjectName(bucket_name);
    const environment = R.prop('environmentByOpenshiftProjectName', environmentResult)

    if (!environment) {
      logger.warn(`Skipping ${webhooktype}:${event}. Error: environment ${bucket_name} not found.`);
      return;
    }

    const backupId = R.prop('id', backup_metrics);
    // mariadb expects a specific timeformat of 'YYYY-MM-DD HH:mm:ss'
    const created = R.ifElse(
      R.propSatisfies(timestamp => timestamp == 0, 'backup_end_timestamp'),
      R.always(moment().format(
        'YYYY-MM-DD HH:mm:ss'
      )),
      R.always(moment(R.prop('backup_end_timestamp', backup_metrics)).format(
        'YYYY-MM-DD HH:mm:ss'
      ))
    )(backup_metrics);

    let source;
    const mountedPvc = R.path(['mounted_PVCs', 0], backup_metrics);
    const folderName = R.pipe(
      R.prop('Folder'),
      R.replace(`${name}-`, ''),
      R.replace('-prebackuppod', ''),
    )(backup_metrics);

    if (mountedPvc) {
      source = mountedPvc;
    } else if (folderName) {
      source = folderName;
    } else {
      source = 'unknown';
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
