// @flow

const { logger } = require('@amazeeio/lagoon-commons/src/local-logging');
const { sendToAmazeeioLogs } = require('@amazeeio/lagoon-commons/src/logs');
const { createRemoveTask } = require('@amazeeio/lagoon-commons/src/tasks');

import type { WebhookRequestData, removeData, ChannelWrapper, SiteGroup  } from '../types';

async function bitbucketBranchDeleted(webhook: WebhookRequestData, siteGroup: SiteGroup) {

    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
    } = webhook;

    const meta = {
      branch: body.push.changes[0].old.name
    }

    const data: removeData = {
      siteGroupName: siteGroup.siteGroupName,
      branch: meta.branch,
      type: 'branch'
    }

    try {
      const taskResult = await createRemoveTask(data);
      sendToAmazeeioLogs('info', siteGroup.siteGroupName, uuid, `${webhooktype}:${event}:handled`, meta,
        `*[${siteGroup.siteGroupName}]* \`${meta.branch}\` deleted in <${body.repository.links.html.href}|${body.repository.full_name}>`
      )
      return;
    } catch (error) {
      switch (error.name) {
        case "SiteGroupNotFound":
        case "NoActiveSystemsDefined":
        case "UnknownActiveSystem":
          // These are not real errors and also they will happen many times. We just log them locally but not throw an error
          sendToAmazeeioLogs('info', siteGroup.siteGroupName, uuid, `${webhooktype}:${event}:handledButNoTask`, meta,
            `*[${siteGroup.siteGroupName}]* \`${meta.branch}\` deleted. No remove task created, reason: ${error}`
          )
          return;

        default:
          // Other messages are real errors and should reschedule the message in RabbitMQ in order to try again
          throw error
      }
    }
}

module.exports = bitbucketBranchDeleted;
