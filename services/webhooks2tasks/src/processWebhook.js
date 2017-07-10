// @flow

import { logger } from '@amazeeio/amazeeio-local-logging';

import { getSiteGroupsByGitUrl } from '@amazeeio/amazeeio-api';
import { SiteGroupNotFound } from '@amazeeio/amazeeio-logs';
import { sendToAmazeeioLogs } from '@amazeeio/amazeeio-logs';
import githubPullRequestClosed from './handlers/githubPullRequestClosed';
import githubBranchDeleted from './handlers/githubBranchDeleted';
import githubPush from './handlers/githubPush';
import gitlabBranchDeleted from './handlers/gitlabBranchDeleted';
import gitlabPush from './handlers/gitlabPush';

import type { WebhookRequestData, ChannelWrapper, RabbitMQMsg, SiteGroup } from './types';


export default async function processWebhook (rabbitMsg: RabbitMQMsg, channelWrapper: ChannelWrapper): Promise<void> {
  const {
    content,
    fields,
    properties,
  } = rabbitMsg;

  const webhook: WebhookRequestData = JSON.parse(content.toString())

  let siteGroups: SiteGroup[]

  const {
    webhooktype,
    event,
    giturl,
    uuid,
    body,
  } = webhook;

  try {
    siteGroups = await getSiteGroupsByGitUrl(giturl)
  }
  catch (error) {
    if (error.name == 'SiteGroupNotFound') {
      logger.warn(`Could not resolve sitegroup for ${giturl} while handling webook ${webhooktype}:${event} ${JSON.stringify(webhook)}`)
      const meta = {
        event: `${webhooktype}:${event}`
      }
      sendToAmazeeioLogs('info', 'unresolved', uuid, `unresolvedSitegroup:webhooks2tasks`, meta,
        `Unresolved sitegroup \`${giturl}\` while handling ${webhooktype}:${event}`
      )
      channelWrapper.ack(rabbitMsg)
    } else {
      logger.error(error)
      channelWrapper.ack(rabbitMsg)
    }
    return
  }

  siteGroups.forEach((siteGroup) => {

    switch (`${webhooktype}:${event}`) {
      case "github:pull_request":

        switch (body.action) {
          case 'closed':
            handle(githubPullRequestClosed, webhook, siteGroup, channelWrapper, rabbitMsg, `${webhooktype}:${event}:${body.action}`)
            break;

          default:
            unhandled(webhook, siteGroup, channelWrapper, rabbitMsg, `${webhooktype}:${event}:${body.action}`)
            break;
        }
        break;

      case "github:delete":
        switch (body.ref_type) {
          case "branch":
            // We do not handle branch deletes via github delete push event, as github also sends a regular push event with 'deleted=true'. It's handled there (see below inside "github:push")
            unhandled(webhook, siteGroup, channelWrapper, rabbitMsg, `${webhooktype}:${event}:${body.ref_type}`)
            break;

          default:
            unhandled(webhook, siteGroup, channelWrapper, rabbitMsg, `${webhooktype}:${event}:${body.ref_type}`)
            break;
        }
        break;

      case "github:push":
        if (body.deleted === true) {
          handle(githubBranchDeleted, webhook, siteGroup, channelWrapper, rabbitMsg, `${webhooktype}:${event}`)
        } else {
          handle(githubPush, webhook, siteGroup, channelWrapper, rabbitMsg, `${webhooktype}:${event}`)
        }

        break;

      case "gitlab:push":
        if (body.after == '0000000000000000000000000000000000000000' ) {
          handle(gitlabBranchDeleted, webhook, siteGroup, channelWrapper, rabbitMsg, `${webhooktype}:${event}`)
        } else {
          handle(gitlabPush, webhook, siteGroup, channelWrapper, rabbitMsg, `${webhooktype}:${event}`)
        }

        break;

      default:
        unhandled(webhook, siteGroup, channelWrapper, rabbitMsg, `${webhooktype}:${event}`)
        break;
    }

  });
}

async function handle(handler, webhook: WebhookRequestData, siteGroup: SiteGroup, channelWrapper: ChannelWrapper, rabbitMsg: RabbitMQMsg, fullEvent: string){
  const {
    webhooktype,
    event,
    giturl,
    uuid,
    body,
  } = webhook;

  logger.info(`Handling ${fullEvent} for sitegroup ${siteGroup.siteGroupName} `, { uuid, giturl });

  try {
    await handler(webhook, siteGroup, channelWrapper)
    channelWrapper.ack(rabbitMsg)
  } catch(error) {
    logger.error(`Error handling ${fullEvent} for sitegroup ${siteGroup.siteGroupName} ${error}`, { webhooktype, event, giturl});
    channelWrapper.ack(rabbitMsg)
  }
}


async function unhandled(webhook: WebhookRequestData, siteGroup: SiteGroup, channelWrapper: ChannelWrapper, rabbitMsg: RabbitMQMsg, fullEvent: string) {
  const {
    webhooktype,
    event,
    giturl,
    uuid,
    body,
  } = webhook;

  logger.warn(`unhandled webhook ${fullEvent} for sitegroup ${siteGroup.siteGroupName} ${JSON.stringify(webhook)}`)
  const meta = {
    fullEvent: fullEvent
  }
  sendToAmazeeioLogs('info', siteGroup.siteGroupName, uuid, `unhandledWebhook`, meta,
    `Unhandled Webhook \`${fullEvent}\` for \`${siteGroup.siteGroupName}\``
  )

  channelWrapper.ack(rabbitMsg)
  return
}
