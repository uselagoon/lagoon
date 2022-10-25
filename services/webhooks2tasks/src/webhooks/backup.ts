import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { logger } from '@lagoon/commons/dist/logs/local-logger';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { resticbackupSnapshotFinished } from '../handlers/resticbackupSnapshotFinished';
import { resticbackupSnapshotSync } from '../handlers/resticbackupSnapshotSync';
import { resticbackupRestoreFinished } from '../handlers/resticbackupRestoreFinished';

import { WebhookRequestData } from '../types';

export async function processBackup(
  rabbitMsg: ConsumeMessage,
  channelWrapperWebhooks: ChannelWrapper
): Promise < void > {
  const webhook: WebhookRequestData = JSON.parse(rabbitMsg.content.toString());

  const {
    webhooktype,
    event
  } = webhook;

  switch (`${webhooktype}:${event}`) {
    case 'resticbackup:snapshot:finished':
      await handle(resticbackupSnapshotFinished, webhook, `${webhooktype}:${event}`);
      break;

    case 'resticbackup:snapshot:sync':
      await handle(resticbackupSnapshotSync, webhook, `${webhooktype}:${event}`, channelWrapperWebhooks);
      break;

    case 'resticbackup:restore:finished':
      await handle(resticbackupRestoreFinished, webhook, `${webhooktype}:${event}`);
      break;

    default:
      unhandled(webhook, `${webhooktype}:${event}`);
      break;
  }

  channelWrapperWebhooks.ack(rabbitMsg);
}

async function handle(handler, webhook: WebhookRequestData, fullEvent: string, channelWrapperWebhooks?: ChannelWrapper) {
  const {
    uuid
  } = webhook;

  logger.info(`Handling ${fullEvent}`, {
    uuid
  });

  try {
    await handler(webhook, channelWrapperWebhooks);
  } catch (error) {
    logger.error(`Error handling ${fullEvent}: ${error.message}`);
  }
}

async function unhandled(webhook: WebhookRequestData, fullEvent: string) {
  const {
    uuid
  } = webhook;

  const meta = {
    fullEvent: fullEvent
  };
  sendToLagoonLogs(
    'info',
    '',
    uuid,
    `unhandledWebhook`,
    meta,
    `Unhandled webhook ${fullEvent}`
  );
  return;
}
