// @flow

const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { logger } = require('@lagoon/commons/src/local-logging');
const {
  deleteBackup,
  getEnvironmentBackups
} = require('@lagoon/commons/src/api');
const R = require('ramda');

import type { WebhookRequestData } from '../types';

async function resticbackupSnapshotSync(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const { name, bucket_name, backup_metrics, snapshots } = body;

    // Get environment and existing backups.
    const environmentResult = await getEnvironmentBackups(bucket_name);
    const environment = R.prop('environmentByOpenshiftProjectName', environmentResult)

    if (!environment) {
      logger.warn(`Skipping ${webhooktype}:${event}. Error: environment ${bucket_name} not found.`);
      return;
    }

    // The webhook contains current snapshots for an environment.
    // Find the backups in the API that aren't in the webhook.
    const prunedBackups = R.differenceWith(
      (backup, snapshot) => backup.backupId === snapshot.id,
      environment.backups,
      snapshots,
    );

    for (const backup of prunedBackups) {
      try {
        await deleteBackup(backup.backupId);
      } catch (error) {
        logger.error(`Could not delete backup, reason: ${error}`)
      }
    }

    return;
  } catch (err) {
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

module.exports = resticbackupSnapshotSync;
