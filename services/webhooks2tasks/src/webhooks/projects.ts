import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { logger } from '@lagoon/commons/dist/logs/local-logger';
import { getProjectsByGitUrl } from '@lagoon/commons/dist/api';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { githubPullRequestClosed } from '../handlers/githubPullRequestClosed';
import { githubPullRequestOpened } from '../handlers/githubPullRequestOpened';
import { githubPullRequestSynchronize } from '../handlers/githubPullRequestSynchronize';
import { githubBranchDeleted } from '../handlers/githubBranchDeleted';
import { githubPush } from '../handlers/githubPush';
import { giteaPullRequestClosed } from '../handlers/giteaPullRequestClosed';
import { giteaPullRequestOpened } from '../handlers/giteaPullRequestOpened';
import { giteaPullRequestSynchronize } from '../handlers/giteaPullRequestSynchronize';
import { giteaBranchDeleted } from '../handlers/giteaBranchDeleted';
import { giteaPush } from '../handlers/giteaPush';
import { bitbucketPush } from '../handlers/bitbucketPush';
import { bitbucketBranchDeleted } from '../handlers/bitbucketBranchDeleted';
import { bitbucketPullRequestUpdated } from '../handlers/bitbucketPullRequestUpdated';
import { bitbucketPullRequestClosed } from '../handlers/bitbucketPullRequestClosed';
import { gitlabPush } from '../handlers/gitlabPush';
import { gitlabBranchDeleted } from '../handlers/gitlabBranchDeleted';
import { gitlabPullRequestClosed } from '../handlers/gitlabPullRequestClosed';
import { gitlabPullRequestOpened } from '../handlers/gitlabPullRequestOpened';
import { gitlabPullRequestUpdated } from '../handlers/gitlabPullRequestUpdated';

import {
  WebhookRequestData,
  Project
} from '../types';

export async function processProjects(
  rabbitMsg: ConsumeMessage,
  channelWrapperWebhooks: ChannelWrapper
): Promise<void> {
  const webhook: WebhookRequestData = JSON.parse(rabbitMsg.content.toString());

  let projects: Project[];

  const { webhooktype, event, giturl, uuid, body } = webhook;

  try {
    projects = await getProjectsByGitUrl(giturl);
  } catch (error) {
    if (error.name == 'ProjectNotFound') {
      const meta = {
        event: `${webhooktype}:${event}`
      };
      sendToLagoonLogs(
        'warn',
        'unresolved',
        uuid,
        `unresolvedProject:webhooks2tasks`,
        meta,
        `Unresolved project \`${giturl}\` while handling ${webhooktype}:${event}`
      );
      channelWrapperWebhooks.ack(rabbitMsg);
    } else {
      // we have an error that we don't know about, let's retry this message a little later

      const retryCount = rabbitMsg.properties.headers['x-retry']
        ? rabbitMsg.properties.headers['x-retry'] + 1
        : 1;

      if (retryCount > 3) {
        sendToLagoonLogs(
          'error',
          '',
          uuid,
          'webhooks2tasks:resolveProject:fail',
          {
            error: error,
            msg: JSON.parse(rabbitMsg.content.toString()),
            retryCount: retryCount
          },
          `Error during loading project for GitURL '${giturl}', bailing after 3 retries, error was: ${error}`
        );
        channelWrapperWebhooks.ack(rabbitMsg);
        return;
      }

      const retryDelaySecs = Math.pow(10, retryCount);
      const retryDelayMilisecs = retryDelaySecs * 1000;

      sendToLagoonLogs(
        'warn',
        '',
        uuid,
        'webhooks2tasks:resolveProject:retry',
        {
          error: error,
          msg: JSON.parse(rabbitMsg.content.toString()),
          retryCount: retryCount
        },
        `Error during loading project for GitURL '${giturl}', will try again in ${retryDelaySecs} secs, error was: ${error}`
      );

      // copying options from the original message
      const retryMsgOptions = {
        appId: rabbitMsg.properties.appId,
        timestamp: rabbitMsg.properties.timestamp,
        contentType: rabbitMsg.properties.contentType,
        deliveryMode: rabbitMsg.properties.deliveryMode,
        headers: {
          ...rabbitMsg.properties.headers,
          'x-delay': retryDelayMilisecs,
          'x-retry': retryCount
        },
        persistent: true
      };
      // publishing a new message with the same content as the original message but into the `lagoon-tasks-delay` exchange,
      // which will send the message into the original exchange `lagoon-tasks` after x-delay time.
      channelWrapperWebhooks.publish(
        `lagoon-webhooks-delay`,
        rabbitMsg.fields.routingKey,
        rabbitMsg.content,
        retryMsgOptions
      );

      // acknologing the existing message, we cloned it and is not necessary anymore
      channelWrapperWebhooks.ack(rabbitMsg);
    }
    return;
  }

  projects.forEach(async project => {
    switch (`${webhooktype}:${event}`) {
      case 'github:pull_request':
        switch (body.action) {
          case 'closed':
            await handle(
              githubPullRequestClosed,
              webhook,
              project,
              `${webhooktype}:${event}:${body.action}`
            );
            break;

          case 'opened':
          case 'reopened':
            await handle(
              githubPullRequestOpened,
              webhook,
              project,
              `${webhooktype}:${event}:${body.action}`
            );
            break;

          case 'synchronize':
          case 'edited':
            await handle(
              githubPullRequestSynchronize,
              webhook,
              project,
              `${webhooktype}:${event}:${body.action}`
            );
            break;

          default:
            unhandled(
              webhook,
              project,
              `${webhooktype}:${event}:${body.action}`
            );
            break;
        }
        break;

      case 'gitea:pull_request':
        switch (body.action) {
          case 'closed':
            await handle(
              giteaPullRequestClosed,
              webhook,
              project,
              `${webhooktype}:${event}:${body.action}`
            );
            break;

          case 'opened':
          case 'reopened':
            await handle(
              giteaPullRequestOpened,
              webhook,
              project,
              `${webhooktype}:${event}:${body.action}`
            );
            break;

          case 'synchronize':
          case 'edited':
            await handle(
              giteaPullRequestSynchronize,
              webhook,
              project,
              `${webhooktype}:${event}:${body.action}`
            );
            break;

          default:
            unhandled(
              webhook,
              project,
              `${webhooktype}:${event}:${body.action}`
            );
            break;
        }
        break;

      case 'github:delete':
      case 'gitea:delete':
        switch (body.ref_type) {
          case 'branch':
            // We do not handle branch deletes via github delete push event, as github also sends a regular push event with 'deleted=true'. It's handled there (see below inside "github:push")
            unhandled(
              webhook,
              project,
              `${webhooktype}:${event}:${body.ref_type}`
            );
            break;

          default:
            unhandled(
              webhook,
              project,
              `${webhooktype}:${event}:${body.ref_type}`
            );
            break;
        }
        break;

      case 'github:push':
        if (body.deleted === true) {
          await handle(
            githubBranchDeleted,
            webhook,
            project,
            `${webhooktype}:${event}`
          );
        } else {
          await handle(githubPush, webhook, project, `${webhooktype}:${event}`);
        }

        break;

      case 'gitea:push':
        if (body.deleted === true) {
          await handle(
            giteaBranchDeleted,
            webhook,
            project,
            `${webhooktype}:${event}`
          );
        } else {
          await handle(giteaPush, webhook, project, `${webhooktype}:${event}`);
        }

        break;

      case 'bitbucket:repo:push':
        if (body.push.changes[0].closed === true) {
          await handle(
            bitbucketBranchDeleted,
            webhook,
            project,
            `${webhooktype}:${event}`
          );
        } else {
          await handle(
            bitbucketPush,
            webhook,
            project,
            `${webhooktype}:${event}`
          );
        }

        break;

      case 'bitbucket:pullrequest:created':
      case 'bitbucket:pullrequest:updated':
        await handle(
          bitbucketPullRequestUpdated,
          webhook,
          project,
          `${webhooktype}:${event}`
        );
        break;
      case 'bitbucket:pullrequest:rejected':
      case 'bitbucket:pullrequest:fulfilled':
        await handle(
          bitbucketPullRequestClosed,
          webhook,
          project,
          `${webhooktype}:${event}`
        );
        break;

      case 'gitlab:push':
        if (body.after == '0000000000000000000000000000000000000000') {
          // be aware, even though we classify this as a delete/remove event by the all-zero sha
          // the gitlab webhook payload has this marked as a normal `push` event
          await handle(
            gitlabBranchDeleted,
            webhook,
            project,
            `${webhooktype}:${event}`
          );
        } else {
          await handle(gitlabPush, webhook, project, `${webhooktype}:${event}`);
        }

        break;

      case 'gitlab:merge_request':
        switch (body.object_attributes.action) {
          case 'open':
            await handle(
              gitlabPullRequestOpened,
              webhook,
              project,
              `${webhooktype}:${event}:${body.object_attributes.action}`
            );
            break;

          case 'update':
            await handle(
              gitlabPullRequestUpdated,
              webhook,
              project,
              `${webhooktype}:${event}:${body.object_attributes.action}`
            );
            break;

          case 'merge':
          case 'close':
            await handle(
              gitlabPullRequestClosed,
              webhook,
              project,
              `${webhooktype}:${event}:${body.object_attributes.action}`
            );
            break;

          default:
            unhandled(
              webhook,
              project,
              `${webhooktype}:${event}:${body.object_attributes.action}`
            );
            break;
        }
        break;

      default:
        unhandled(webhook, project, `${webhooktype}:${event}`);
        break;
    }
  });
  channelWrapperWebhooks.ack(rabbitMsg);
}

async function handle(
  handler,
  webhook: WebhookRequestData,
  project: Project,
  fullEvent: string
) {
  const { webhooktype, event, giturl, uuid, body } = webhook;

  logger.info(`Handling ${fullEvent} for project ${project.name} `, {
    uuid,
    giturl
  });

  try {
    await handler(webhook, project);
  } catch (error) {
    logger.error(`Error handling ${fullEvent} for project ${project.name}: ${error.message}`);
  }
}

async function unhandled(
  webhook: WebhookRequestData,
  project: Project,
  fullEvent: string
) {
  const { webhooktype, event, giturl, uuid, body } = webhook;

  const meta = {
    fullEvent: fullEvent
  };
  sendToLagoonLogs(
    'info',
    project.name,
    uuid,
    `unhandledWebhook`,
    meta,
    `Unhandled Webhook \`${fullEvent}\` for \`${project.name}\``
  );
  return;
}
