import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { logger } from '@lagoon/commons/dist/logs/local-logger';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { gitlabGroupCreate } from '../handlers/gitlabGroupCreate';
import { gitlabGroupUpdate } from '../handlers/gitlabGroupUpdate';
import { gitlabGroupDelete } from '../handlers/gitlabGroupDelete';
import { gitlabProjectCreate } from '../handlers/gitlabProjectCreate';
import { gitlabProjectUpdate } from '../handlers/gitlabProjectUpdate';
import { gitlabProjectDelete } from '../handlers/gitlabProjectDelete';
import { gitlabUserCreate } from '../handlers/gitlabUserCreate';
import { gitlabUserUpdate } from '../handlers/gitlabUserUpdate';
import { gitlabUserDelete } from '../handlers/gitlabUserDelete';
import { gitlabUserGroupAdd } from '../handlers/gitlabUserGroupAdd';
import { gitlabUserGroupRemove } from '../handlers/gitlabUserGroupRemove';
import { gitlabUserProjectAdd } from '../handlers/gitlabUserProjectAdd';
import { gitlabUserProjectRemove } from '../handlers/gitlabUserProjectRemove';
import { gitlabSshKeyAdd } from '../handlers/gitlabSshKeyAdd';
import { gitlabSshKeyRemove } from '../handlers/gitlabSshKeyRemove';

import { WebhookRequestData } from '../types';

export async function processDataSync(
  rabbitMsg: ConsumeMessage,
  channelWrapperWebhooks: ChannelWrapper
): Promise<void> {
  const webhook: WebhookRequestData = JSON.parse(rabbitMsg.content.toString());

  const { webhooktype, event } = webhook;

  switch (`${webhooktype}:${event}`) {
    case 'gitlab:group_create':
      await handle(gitlabGroupCreate, webhook, `${webhooktype}:${event}`);
      break;

    case 'gitlab:group_rename':
    case 'gitlab:PLACEHOLDER_group_update':
      await handle(gitlabGroupUpdate, webhook, `${webhooktype}:${event}`);
      break;

    case 'gitlab:group_destroy':
      await handle(gitlabGroupDelete, webhook, `${webhooktype}:${event}`);
      break;

    case 'gitlab:project_create':
      await handle(gitlabProjectCreate, webhook, `${webhooktype}:${event}`);
      break;

    case 'gitlab:project_transfer':
    case 'gitlab:project_rename':
    case 'gitlab:project_update':
      await handle(gitlabProjectUpdate, webhook, `${webhooktype}:${event}`);
      break;

    case "gitlab:project_destroy":
      await handle(gitlabProjectDelete, webhook, `${webhooktype}:${event}`);
      break;

    case "gitlab:user_create":
      await handle(gitlabUserCreate, webhook, `${webhooktype}:${event}`);
      break;

    case "gitlab:user_rename":
    case "gitlab:PLACEHOLDER_user_update":
      await handle(gitlabUserUpdate, webhook, `${webhooktype}:${event}`);
      break;

    case "gitlab:user_destroy":
      await handle(gitlabUserDelete, webhook, `${webhooktype}:${event}`);
      break;

    case "gitlab:user_add_to_group":
      await handle(gitlabUserGroupAdd, webhook, `${webhooktype}:${event}`);
      break;

    case "gitlab:user_remove_from_group":
      await handle(gitlabUserGroupRemove, webhook, `${webhooktype}:${event}`);
      break;


    case "gitlab:user_add_to_team":
      await handle(gitlabUserProjectAdd, webhook, `${webhooktype}:${event}`);
      break;

    case "gitlab:user_remove_from_team":
      await handle(gitlabUserProjectRemove, webhook, `${webhooktype}:${event}`);
      break;

    case "gitlab:key_create":
      await handle(gitlabSshKeyAdd, webhook, `${webhooktype}:${event}`);
      break;

    case "gitlab:key_destroy":
      await handle(gitlabSshKeyRemove, webhook, `${webhooktype}:${event}`);
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
    logger.error(`Error handling ${fullEvent}: ${error.message}`);
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
