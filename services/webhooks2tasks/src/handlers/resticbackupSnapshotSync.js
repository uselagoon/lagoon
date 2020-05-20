// @flow

const uuid4 = require('uuid4');
const { sendToLagoonLogs } = require('@lagoon/commons/dist/logs');
const { logger } = require('@lagoon/commons/dist/local-logging');
const {
  deleteBackup,
  getEnvironmentBackups
} = require('@lagoon/commons/dist/api');
const R = require('ramda');

import type { WebhookRequestData, ChannelWrapper } from '../types';

async function resticbackupSnapshotSync(webhook: WebhookRequestData, channelWrapperWebhooks: ChannelWrapper) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const { name, bucket_name, backup_metrics, snapshots } = body;

    // Get environment and existing backups.
    const environmentResult = await getEnvironmentBackups(name);
    const environment = R.prop('environmentByOpenshiftProjectName', environmentResult)

    if (!environment) {
      logger.warn(`Skipping ${webhooktype}:${event}. Error: environment ${name} not found.`);
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

    const newBackups = R.differenceWith(
      (snapshot, backup) => backup.backupId === snapshot.id,
      snapshots,
      environment.backups,
    );

    for (const backup of newBackups) {
      const webhookData = {
        webhooktype: 'resticbackup',
        event: 'snapshot:finished',
        giturl: webhook.giturl,
        uuid: uuid4(),
        body: {
          ...body,
          snapshots: [
            backup,
          ]
        }
      }

      try {
        const buffer = new Buffer(JSON.stringify(webhookData));
        await channelWrapperWebhooks.publish(`lagoon-webhooks`, '', buffer, { persistent: true });
      } catch(error) {
        logger.error(`Error queuing lagoon-webhooks resticbackup:snapshot:finished, error: ${error}`);
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
