// @flow

const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const {
  deleteBackup,
  getAllEnvironmentBackups
} = require('@lagoon/commons/src/api');
const R = require('ramda');

import type { WebhookRequestData } from '../types';

async function resticbackupSnapshotFinished(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    // Get a list of all environments and their existing backups.
    const allEnvironmentsResult = await getAllEnvironmentBackups();
    const allEnvironments = R.prop('allEnvironments', allEnvironmentsResult)
    const existingBackups = R.pipe(
      R.map(env => env.backups),
      R.flatten(),
    )(allEnvironments);

    // The webhook contains all existing snapshots made for all environments.
    // Get recorded backups that no longer exist in the webhook.
    const snapshotsNotPruned = body;
    const prunedBackups = R.differenceWith(
      (backup, snapshot) => backup.backupId === snapshot.id,
      existingBackups,
      snapshotsNotPruned,
    );

    const envHasBackupId = backupId => R.compose(R.any(R.propEq('backupId', backupId)), R.prop('backups'))

    for (const backup of prunedBackups) {
      try {
        const environment = R.find(envHasBackupId(backup.backupId), allEnvironments);
        await deleteBackup(backup.backupId);

        const meta = {
          backupId: backup.backupId,
          project: environment.project.name,
        };

        sendToLagoonLogs(
          'info',
          '',
          uuid,
          `${webhooktype}:${event}:pruned`,
          meta,
          `Deleted backup ${
            backup.backupId
          } for environment ${environment.name}`
        );
      } catch (error) {
        sendToLagoonLogs(
          'error',
          '',
          uuid,
          `${webhooktype}:${event}:error`,
          {
            data: body
          },
          `Could not delete backup, reason: ${error}`
        );
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
      `Could not prune snapshots, reason: ${error}`
    );

    return;
  }
}

module.exports = resticbackupSnapshotFinished;
