// @flow

const { logger } = require('@lagoon/commons/dist/local-logging');
const { sendToLagoonLogs } = require('@lagoon/commons/dist/logs');
const { createDeployTask } = require('@lagoon/commons/dist/tasks');
const R = require('ramda');

import type { WebhookRequestData, deployData, ChannelWrapper, Project  } from '../types';

async function githubPush(webhook: WebhookRequestData, project: Project) {

    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
    } = webhook;

    const branchName = body.ref.toLowerCase().replace('refs/heads/','')
    const sha = body.after

    const skip_deploy = R.pathOr('',['head_commit','message'], body).match(/\[skip deploy\]|\[deploy skip\]/i)

    const meta = {
      projectName: project.name,
      branch: branchName,
      sha: sha,
      shortSha: sha.substring(0, 7),
      repoFullName: body.repository.full_name,
      repoUrl: body.repository.html_url,
      branchName: branchName,
      commitUrl: body.head_commit.url,
      event: event,
    }

    const data: deployData = {
      projectName: project.name,
      type: 'branch',
      branchName: branchName,
      sha: sha,
    }

    let logMessage = `\`<${body.repository.html_url}/tree/${meta.branch}|${meta.branch}>\``
    if (sha) {
      const shortSha: string = sha.substring(0, 7)
      logMessage = `${logMessage} (<${body.head_commit.url}|${shortSha}>)`
    }

    if (skip_deploy) {
      sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:skipped`, meta,
        `*[${project.name}]* ${logMessage} pushed in <${body.repository.html_url}|${body.repository.full_name}> *deployment skipped*`
      )
      return;
    }

    try {
      const taskResult = await createDeployTask(data);
      sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:handled`, meta,
        `*[${project.name}]* ${logMessage} pushed in <${body.repository.html_url}|${body.repository.full_name}>`
      )
      return;
    } catch (error) {
      switch (error.name) {
        case "ProjectNotFound":
        case "NoActiveSystemsDefined":
        case "UnknownActiveSystem":
        case "NoNeedToDeployBranch":
          // These are not real errors and also they will happen many times. We just log them locally but not throw an error
          sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:handledButNoTask`, meta,
            `*[${project.name}]* ${logMessage}. No deploy task created, reason: ${error}`
          )
          return;

        default:
          // Other messages are real errors and should reschedule the message in RabbitMQ in order to try again
          throw error
      }
    }

}

module.exports = githubPush;
