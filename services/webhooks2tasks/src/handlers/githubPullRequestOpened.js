// @flow

const { logger } = require('@amazeeio/lagoon-commons/src/local-logging');
const { sendToAmazeeioLogs } = require('@amazeeio/lagoon-commons/src/logs');
const { createRemoveTask } = require('@amazeeio/lagoon-commons/src/tasks');

import type { WebhookRequestData, removeData, ChannelWrapper, SiteGroup } from '../types';

async function githubPullRequestOpened(webhook: WebhookRequestData, siteGroup: SiteGroup) {

    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
    } = webhook;

    const headBranchName = body.pull_request.head.ref
    const headSha = body.pull_request.head.sha
    const baseBranchName = body.pull_request.base.ref
    const baseSha = body.pull_request.base.sha

    const meta = {
      pullrequest: body.number,
      headBranchName: headBranchName,
      headSha: headSha,
      baseBranchName: baseBranchName,
      baseSha: baseSha
    }

    const data: deployData = {
      pullrequest: body.number,
      siteGroupName: siteGroup.siteGroupName,
      type: 'pullrequest',
      headBranchName: headBranchName,
      headSha: headSha,
      baseBranchName: baseBranchName,
      baseSha: baseSha,
      branchName: `pr-${body.number}`
    }

    try {
      const taskResult = await createDeployTask(data);
      sendToAmazeeioLogs('info', siteGroup.siteGroupName, uuid, `${webhooktype}:${event}:opened:handled`, meta,
        `*[${siteGroup.siteGroupName}]* PR <${body.pull_request.html_url}|#${body.number} (${body.pull_request.title})> opened in <${body.repository.html_url}|${body.repository.full_name}>`
      )
      return;
    } catch (error) {
      switch (error.name) {
        case "SiteGroupNotFound":
        case "NoActiveSystemsDefined":
        case "UnknownActiveSystem":
          // These are not real errors and also they will happen many times. We just log them locally but not throw an error
          sendToAmazeeioLogs('info', siteGroup.siteGroupName, uuid, `${webhooktype}:${event}:handledButNoTask`, meta,
            `*[${siteGroup.siteGroupName}]* PR ${body.number} opened. No remove task created, reason: ${error}`
          )
          return;

        default:
          // Other messages are real errors and should reschedule the message in RabbitMQ in order to try again
          throw error
      }
    }
}

module.exports = githubPullRequestOpened;
