// @flow

const {
  logger
} = require('@lagoon/commons/src/local-logging');
const {
  sendToLagoonLogs
} = require('@lagoon/commons/src/logs');
const resticbackupSnapshotFinished = require('../handlers/resticbackupSnapshotFinished');

import type {
  WebhookRequestData,
  ChannelWrapper,
  RabbitMQMsg
} from './types';

async function processBackup(
  rabbitMsg: RabbitMQMsg,
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

    default:
      unhandled(webhook, `${webhooktype}:${event}`);
      break;
  }

  channelWrapperWebhooks.ack(rabbitMsg);
}

async function handle(handler, webhook: WebhookRequestData, fullEvent: string) {
  const {
    uuid
  } = webhook;

  logger.info(`Handling ${fullEvent}`, {
    uuid
  });

  try {
    await handler(webhook);
  } catch (error) {
    logger.error(`Error handling ${fullEvent}`);
    logger.error(error);
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

module.exports = processBackup;