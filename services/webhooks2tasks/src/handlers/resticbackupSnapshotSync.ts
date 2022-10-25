import R from 'ramda';
import uuid4 from 'uuid4';
import { ChannelWrapper } from 'amqp-connection-manager';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { logger } from '@lagoon/commons/dist/logs/local-logger';
import { deleteBackup, getEnvironmentBackups } from '@lagoon/commons/dist/api';

import { WebhookRequestData } from '../types';

export async function resticbackupSnapshotSync(webhook: WebhookRequestData, channelWrapperWebhooks: ChannelWrapper) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const { name, bucket_name, backup_metrics, snapshots } = body;

    // Get environment and existing backups.
    const environmentResult = await getEnvironmentBackups(name);
    const environment: any = R.prop('environmentByOpenshiftProjectName', environmentResult)

    if (!environment) {
      logger.warn(`Skipping ${webhooktype}:${event}. Error: environment ${name} not found.`);
      return;
    }

    // The webhook contains current snapshots for an environment.
    // Find the backups in the API that aren't in the webhook.
    const prunedBackups: any = R.differenceWith(
      (backup: any, snapshot: any) => backup.backupId === snapshot.id,
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

    const newBackups: any = R.differenceWith(
      (snapshot: any, backup: any) => backup.backupId === snapshot.id,
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
      `Could not sync snapshots, reason: ${err.message}`
    );

    return;
  }
}
