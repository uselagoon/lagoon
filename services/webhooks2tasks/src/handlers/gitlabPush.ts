import R from 'ramda';
import { DeployData, DeploymentSourceType, DeployType } from '@lagoon/commons/dist/types';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { createDeployTask } from '@lagoon/commons/dist/tasks';
import { generateBuildId } from '@lagoon/commons/dist/util/lagoon';

import { WebhookRequestData, Project } from '../types';

export async function gitlabPush(webhook: WebhookRequestData, project: Project) {

    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
    } = webhook;

    const branchName = body.ref.toLowerCase().replace('refs/heads/','')
    const sha = body.after

    // @ts-ignore
    const skip_deploy = R.pathOr('',['commits',0,'message'], body).match(/\[skip deploy\]|\[deploy skip\]/i)

    const meta = {
      projectName: project.name,
      branch: branchName,
      sha: sha,
      shortSha: sha.substring(0, 7),
      repoName: body.project.name,
      repoFullName: body.project.path_with_namespace,
      repoUrl: body.project.http_url,
      branchName: branchName,
      commitUrl: body.commits[0].url,
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
    if (body.user_username) {
      sourceUser = body.user_username
    }
    const data: DeployData = {
      projectName: project.name,
      type: DeployType.BRANCH,
      branchName: branchName,
      sha: sha,
      buildName: buildName,
      sourceUser: sourceUser,
      sourceType: DeploymentSourceType.WEBHOOK,
      bulkId: webhook.bulkId,
      bulkName: webhook.bulkName,
    }

    let logMessage = `\`<${body.project.http_url}/tree/${meta.branch}|${meta.branch}>\``
    if (sha && (body.commits.length > 0)) {
      const shortSha: string = sha.substring(0, 7)
      logMessage = `${logMessage} (<${body.commits[0].url}|${shortSha}>)`
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
        `*[${project.name}]* ${logMessage} pushed in <${body.project.http_url}|${body.project.path_with_namespace}>`
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
