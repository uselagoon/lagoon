// @flow

const { logger } = require('@lagoon/commons/dist/local-logging');
const { sendToLagoonLogs } = require('@lagoon/commons/dist/logs');
const { createRemoveTask } = require('@lagoon/commons/dist/tasks');

import type { WebhookRequestData, removeData, ChannelWrapper, Project  } from '../types';

async function bitbucketPullRequestClosed(webhook: WebhookRequestData, project: Project) {

    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
    } = webhook;

    const meta = {
      projectName: project.name,
      pullrequestTitle: body.pullrequest.title,
      pullrequestNumber: body.pullrequest.id,
      pullrequestUrl: body.pullrequest.destination.repository.links.html.href,
      repoName: body.repository.full_name,
      repoUrl: body.repository.links.html.href,
    }

    const data: removeData = {
      projectName: project.name,
      pullrequestNumber: body.pullrequest.id,
      pullrequestTitle: body.pullrequest.title,
      type: 'pullrequest'
    }

    try {
      const taskResult = await createRemoveTask(data);
      sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:handled`, meta,
        `*[${project.name}]* PR \`${body.pullrequest.id}\` deleted in <${body.pullrequest.destination.repository.links.html.href}|${body.pullrequest.destination.branch.name}>`
      )
      return;
    } catch (error) {
      switch (error.name) {
        case "ProjectNotFound":
        case "NoActiveSystemsDefined":
        case "UnknownActiveSystem":
          // These are not real errors and also they will happen many times. We just log them locally but not throw an error
          sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:handledButNoTask`, meta,
            `*[${project.name}]* \`${body.pullrequest.id}\` deleted. No remove task created, reason: ${error}`
          )
          return;

        case "CannotDeleteProductionEnvironment":
          // These are not real errors and also they will happen many times. We just log them locally but not throw an error
          sendToLagoonLogs('warning', project.name, uuid, `${webhooktype}:${event}:CannotDeleteProductionEnvironment`, meta,
            `*[${project.name}]* \`${meta.branch}\` not deleted. ${error}`
          )
          return;

        default:
          // Other messages are real errors and should reschedule the message in RabbitMQ in order to try again
          throw error
      }
    }
}

module.exports = bitbucketPullRequestClosed;
