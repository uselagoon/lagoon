// @flow

const { logger } = require('@lagoon/commons/src/local-logging');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const gitlabGroupCreate = require('../handlers/gitlabGroupCreate');
const gitlabGroupUpdate = require('../handlers/gitlabGroupUpdate');
const gitlabGroupDelete = require('../handlers/gitlabGroupDelete');

import type { WebhookRequestData, ChannelWrapper, RabbitMQMsg } from './types';

async function processOther(
  rabbitMsg: RabbitMQMsg,
  channelWrapperWebhooks: ChannelWrapper
): Promise<void> {
  const webhook: WebhookRequestData = JSON.parse(rabbitMsg.content.toString());

  const { webhooktype, event } = webhook;

  switch (`${webhooktype}:${event}`) {
    case 'gitlab:group_create':
      await handle(gitlabGroupCreate, webhook, `${webhooktype}:${event}`);
      break;

    case "gitlab:group_rename":
    case "gitlab:PLACEHOLDER_group_update":
      await handle(gitlabGroupUpdate, webhook, `${webhooktype}:${event}`);
      break;

    case "gitlab:group_destroy":
      await handle(gitlabGroupDelete, webhook, `${webhooktype}:${event}`);
      break;

    default:
      unhandled(webhook, `${webhooktype}:${event}`);
      break;
  }

  channelWrapperWebhooks.ack(rabbitMsg);
}

async function handle(handler, webhook: WebhookRequestData, fullEvent: string) {
  const { uuid } = webhook;

  logger.info(`Handling ${fullEvent}`, { uuid });

  try {
    await handler(webhook);
  } catch (error) {
    logger.error(`Error handling ${fullEvent}`);
    logger.error(error);
  }
}

async function unhandled(webhook: WebhookRequestData, fullEvent: string) {
  const { uuid } = webhook;

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

module.exports = processOther;
