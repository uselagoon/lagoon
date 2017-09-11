// @flow

const { logger } = require('@amazeeio/lagoon-commons/src/local-logging');
const { sendToAmazeeioLogs } = require('@amazeeio/lagoon-commons/src/logs');
const { createDeployTask } = require('@amazeeio/lagoon-commons/src/tasks');

import type { WebhookRequestData, deployData, ChannelWrapper, SiteGroup  } from '../types';

async function bitbucketPush(webhook: WebhookRequestData, siteGroup: SiteGroup) {

    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
    } = webhook;

    const branchName = body.push.changes[0].new.name.toLowerCase()
    const sha = body.push.changes[0].commits[0].hash

    const meta = {
      branch: branchName,
      sha: sha
    }

    const data: deployData = {
      siteGroupName: siteGroup.siteGroupName,
      type: 'branch',
      branchName: branchName,
      sha: sha
    }

    let logMessage = `\`<${body.push.changes[0].new.links.html.href}>\``
    if (sha) {
      const shortSha: string = sha.substring(0, 7)
      logMessage = `${logMessage} (<${body.push.changes[0].new.target.links.html.href}|${shortSha}>)`
    }

    try {
      const taskResult = await createDeployTask(data);
      sendToAmazeeioLogs('info', siteGroup.siteGroupName, uuid, `${webhooktype}:${event}:handled`, meta,
        `*[${siteGroup.siteGroupName}]* ${logMessage} pushed in <${body.repository.links.html.href}|${body.repository.full_name}>`
      )
      return;
    } catch (error) {
      switch (error.name) {
        case "SiteGroupNotFound":
        case "NoActiveSystemsDefined":
        case "UnknownActiveSystem":
        case "NoNeedToDeployBranch":
          // These are not real errors and also they will happen many times. We just log them locally but not throw an error
          sendToAmazeeioLogs('info', siteGroup.siteGroupName, uuid, `${webhooktype}:${event}:handledButNoTask`, meta,
            `*[${siteGroup.siteGroupName}]* ${logMessage}. No deploy task created, reason: ${error}`
          )
          return;

        default:
          // Other messages are real errors and should reschedule the message in RabbitMQ in order to try again
          throw error
      }
    }

}

module.exports = bitbucketPush;
