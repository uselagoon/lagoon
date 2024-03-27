import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { createDeployTask } from '@lagoon/commons/dist/tasks';
import { generateBuildId } from '@lagoon/commons/dist/util/lagoon';

import { WebhookRequestData, deployData, Project } from '../types';

export async function bitbucketPush(webhook: WebhookRequestData, project: Project) {

    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
    } = webhook;

    const branchName = body.push.changes[0].new.name.toLowerCase()
    const sha = body.push.changes[0].commits[0].hash
    var skip_deploy = false

    if (body.push.commits) {
      skip_deploy = body.push.changes[0].commits[0].message.match(/\[skip deploy\]|\[deploy skip\]/i)
    }

    const meta = {
      branch: branchName,
      branchName: branchName,
      commitUrl: body.push.changes[0].new.target.links.html.href,
      projectName: project.name,
      repoFullName:body.repository.full_name,
      repoUrl: body.repository.links.html.href,
      sha: sha,
      shortSha: sha.substring(0, 7),
    }

    if (project.deploymentsDisabled == 1) {
      sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:handledButNoTask`, meta,
        `*[${project.name}]* No deploy task created, reason: deployments are disabled`
      )
      return;
    }

    let buildName = generateBuildId();

    // try get the user from the webhook payload
    // otherwise just use "webhook" as the trigger user
    let sourceUser = "webhook"
    if (body.actor.username) {
      sourceUser = body.actor.username
    }
    const data: deployData = {
      projectName: project.name,
      type: 'branch',
      branchName: branchName,
      sha: sha,
      buildName: buildName,
      sourceUser: sourceUser,
      sourceType: "WEBHOOK",
    }

    let logMessage = `\`<${body.push.changes[0].new.links.html.href}>\``
    if (sha) {
      const shortSha: string = sha.substring(0, 7)
      logMessage = `${logMessage} (<${body.push.changes[0].new.target.links.html.href}|${shortSha}>)`
    }

    if (skip_deploy) {
      sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:skipped`, meta,
        `*[${project.name}]* ${logMessage} pushed in <${body.repository.html_url}|${body.repository.full_name}> *deployment skipped*`
      )
      return;
    }

    try {
      await createDeployTask(data);
      sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:handled`, meta,
        `*[${project.name}]* ${logMessage} pushed in <${body.repository.links.html.href}|${body.repository.full_name}>`
      )
      return;
    } catch (error) {
      switch (error.name) {
        case "ProjectNotFound":
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
