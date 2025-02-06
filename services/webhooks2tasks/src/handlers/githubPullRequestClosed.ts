import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { createRemoveTask } from '@lagoon/commons/dist/tasks';
import { getOpenShiftInfoForProject } from '@lagoon/commons/dist/api';

import { WebhookRequestData, Project } from '../types';
import { DeployType, RemoveData } from '@lagoon/commons/dist/types';

export async function githubPullRequestClosed(webhook: WebhookRequestData, project: Project) {

    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
      user,
      sender,
    } = webhook;

    const meta: { [key: string]: any } = {
      projectName: project.name,
      pullrequestTitle: body.pull_request.title,
      pullrequestNumber: body.number,
      pullrequestUrl: body.pull_request.html_url,
      repoName: body.repository.full_name,
      repoUrl: body.repository.html_url,
    }

    if (project.deploymentsDisabled == 1) {
      sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:handledButNoTask`, meta,
        `*[${project.name}]* No deploy task created, reason: deployments are disabled`
      )
      return;
    }

    const result = await getOpenShiftInfoForProject(project.name);
    const projectOpenShift = result.project;

    const ocsafety = string =>
    string.toLocaleLowerCase().replace(/[^0-9a-z-]/g, '-');

    let branchName = `pr-${body.number}`
    let openshiftProjectName = projectOpenShift.openshiftProjectPattern
    ? projectOpenShift.openshiftProjectPattern
        .replace('${branch}', ocsafety(branchName))
        .replace('${project}', ocsafety(project.name))
    : ocsafety(`${project.name}-${branchName}`);

    const data: RemoveData = {
      projectName: project.name,
      pullrequestNumber: body.number,
      pullrequestTitle: body.pull_request.title,
      branch: branchName,
      openshiftProjectName: openshiftProjectName,
      type: DeployType.PULLREQUEST
    }

    try {
      await createRemoveTask(data);
      sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:closed:handled`, meta,
        `*[${project.name}]* PR <${body.pull_request.html_url}|#${body.number} (${body.pull_request.title})> by <${body.pull_request.user.html_url}|${body.pull_request.user.login}> changed by <${body.sender.html_url}|${body.sender.login}> closed in <${body.repository.html_url}|${body.repository.full_name}>`
      )
      return;
    } catch (error) {
      meta.error = error
      switch (error.name) {
        case "ProjectNotFound":
          // These are not real errors and also they will happen many times. We just log them locally but not throw an error
          sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:handledButNoTask`, meta,
            `*[${project.name}]* PR ${body.number} closed. No remove task created, reason: ${error}`
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
