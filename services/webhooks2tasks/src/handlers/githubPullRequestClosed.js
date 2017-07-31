// @flow

const { logger } = require('@amazeeio/lagoon-commons/src/local-logging');
const { sendToAmazeeioLogs } = require('@amazeeio/lagoon-commons/src/logs');
const { createRemoveTask } = require('@amazeeio/lagoon-commons/src/tasks');

import type { WebhookRequestData, removeData, ChannelWrapper, SiteGroup } from '../types';

async function githubPullRequestClosed(webhook: WebhookRequestData, siteGroup: SiteGroup) {

    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
    } = webhook;

    const meta = {
      pullrequest: body.number
    }

    const data: removeData = {
      siteGroupName: siteGroup.siteGroupName,
      pullrequest: body.number,
      type: 'pullrequest'
    }

    try {
      const taskResult = await createRemoveTask(data);
      sendToAmazeeioLogs('info', siteGroup.siteGroupName, uuid, `${webhooktype}:${event}:closed:handled`, meta,
        `*[${siteGroup.siteGroupName}]* PR <${body.pull_request.html_url}|#${body.number} (${body.pull_request.title})> closed in <${body.repository.html_url}|${body.repository.full_name}>`
      )
      return;
    } catch (error) {
      switch (error.name) {
        case "SiteGroupNotFound":
        case "NoActiveSystemsDefined":
        case "UnknownActiveSystem":
          // These are not real errors and also they will happen many times. We just log them locally but not throw an error
          sendToAmazeeioLogs('info', siteGroup.siteGroupName, uuid, `${webhooktype}:${event}:handledButNoTask`, meta,
            `*[${siteGroup.siteGroupName}]* PR ${body.number} closed. No remove task created, reason: ${error}`
          )
          return;

        default:
          // Other messages are real errors and should reschedule the message in RabbitMQ in order to try again
          throw error
      }
    }
}

module.exports = githubPullRequestClosed;
