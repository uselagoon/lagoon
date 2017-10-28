// @flow

const { logger } = require('@amazeeio/lagoon-commons/src/local-logging');
const { sendToAmazeeioLogs } = require('@amazeeio/lagoon-commons/src/logs');
const { createDeployTask } = require('@amazeeio/lagoon-commons/src/tasks');

import type { WebhookRequestData, removeData, ChannelWrapper, Project } from '../types';

async function githubPullRequestOpened(webhook: WebhookRequestData, project: Project) {

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

    const data: deployData = {
      pullrequestNumber: body.number,
      projectName: project.name,
      type: 'pullrequest',
      headBranchName: headBranchName,
      headSha: headSha,
      baseBranchName: baseBranchName,
      baseSha: baseSha,
      branchName: `pr-${body.number}`
    }

    try {
      const taskResult = await createDeployTask(data);
      sendToAmazeeioLogs('info', project.name, uuid, `${webhooktype}:${event}:opened:handled`, data,
        `*[${project.name}]* PR <${body.pull_request.html_url}|#${body.number} (${body.pull_request.title})> opened in <${body.repository.html_url}|${body.repository.full_name}>`
      )
      return;
    } catch (error) {
      switch (error.name) {
        case "ProjectNotFound":
        case "NoActiveSystemsDefined":
        case "UnknownActiveSystem":
          // These are not real errors and also they will happen many times. We just log them locally but not throw an error
          sendToAmazeeioLogs('info', project.name, uuid, `${webhooktype}:${event}:handledButNoTask`, meta,
            `*[${project.name}]* PR ${body.number} opened. No remove task created, reason: ${error}`
          )
          return;

        default:
          // Other messages are real errors and should reschedule the message in RabbitMQ in order to try again
          throw error
      }
    }
}

module.exports = githubPullRequestOpened;
