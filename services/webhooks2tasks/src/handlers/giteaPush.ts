import R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { createDeployTask } from '@lagoon/commons/dist/tasks';
import { generateBuildId } from '@lagoon/commons/dist/util/lagoon';

import { WebhookRequestData, deployData, Project } from '../types';

export async function giteaPush(webhook: WebhookRequestData, project: Project) {

    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
    } = webhook;

    const branchName = body.ref.toLowerCase().replace('refs/heads/','')
    const sha = body.after
    var afterUrl = `${body.repository.html_url}/commit/${body.after}`

    // @ts-ignore
    const skip_deploy = R.pathOr('',['head_commit','message'], body).match(/\[skip deploy\]|\[deploy skip\]/i)

    const meta = {
      projectName: project.name,
      branch: branchName,
      sha: sha,
      shortSha: sha.substring(0, 7),
      repoFullName: body.repository.full_name,
      repoUrl: body.repository.html_url,
      branchName: branchName,
      commitUrl: afterUrl,
      event: event,
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
    if (body.sender.login) {
      sourceUser = body.sender.login
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

    let logMessage = `\`<${body.repository.html_url}/tree/${meta.branch}|${meta.branch}>\``
    if (sha) {
      const shortSha: string = sha.substring(0, 7)
      logMessage = `${logMessage} (<${afterUrl}|${shortSha}>)`
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
