// @flow

const { logger } = require('@lagoon/commons/src/local-logging');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { createDeployTask } = require('@lagoon/commons/src/tasks');

import type { WebhookRequestData, removeData, ChannelWrapper, Project } from '../types';

async function bitbucketPullRequestUpdated(webhook: WebhookRequestData, project: Project) {

    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
    } = webhook;

    console.log(body);

    const headBranchName = body.pullrequest.source.branch.name
    const headSha = body.pullrequest.source.commit.hash
    const baseBranchName = body.pullrequest.destination.branch.name
    const baseSha = body.pullrequest.destination.commit.hash

    const data: deployData = {
      repoName: body.repository.full_name,
      repoUrl: body.repository.links.html.href,
      pullrequestUrl: body.pullrequest.links.html.href,
      pullrequestTitle: body.pullrequest.title,
      pullrequestNumber: body.pullrequest.id,
      projectName: project.name,
      type: 'pullrequest',
      headBranchName: headBranchName,
      headSha: headSha,
      baseBranchName: baseBranchName,
      baseSha: baseSha,
      branchName: `pr-${body.pullrequest.id}`,
    }

    try {
      const taskResult = await createDeployTask(data);
      sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:opened:handled`, data,
        `*[${project.name}]* PR <${body.pullrequest.destination.repository.links.html.href}|#${body.pullrequest.id} (${body.title})> updated in <${body.pullrequest.destination.repository.links.html.href}|${body.pullrequest.destination.branch.name}>`
      )
      return;
    } catch (error) {
      switch (error.name) {
        case "ProjectNotFound":
        case "NoActiveSystemsDefined":
        case "UnknownActiveSystem":
          // These are not real errors and also they will happen many times. We just log them locally but not throw an error
          sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:handledButNoTask`, meta,
            `*[${project.name}]* PR ${body.object_attributes.id} opened. No remove task created, reason: ${error}`
          )
          return;

        default:
          // Other messages are real errors and should reschedule the message in RabbitMQ in order to try again
          throw error
      }
    }
}

module.exports = bitbucketPullRequestUpdated;
