import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { createRemoveTask } from '@lagoon/commons/dist/tasks';
import { getOpenShiftInfoForProject } from '@lagoon/commons/dist/api';

import { WebhookRequestData, removeData, Project } from '../types';

export async function bitbucketPullRequestClosed(webhook: WebhookRequestData, project: Project) {

    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
    } = webhook;

    const meta: { [key: string]: any } = {
      projectName: project.name,
      pullrequestTitle: body.pullrequest.title,
      pullrequestNumber: body.pullrequest.id,
      pullrequestUrl: body.pullrequest.destination.repository.links.html.href,
      repoName: body.repository.full_name,
      repoUrl: body.repository.links.html.href,
    }

    const result = await getOpenShiftInfoForProject(project.name);
    const projectOpenShift = result.project;

    const ocsafety = string =>
    string.toLocaleLowerCase().replace(/[^0-9a-z-]/g, '-');

    let branchName = `pr-${body.pullrequest.id}`
    let openshiftProjectName = projectOpenShift.openshiftProjectPattern
    ? projectOpenShift.openshiftProjectPattern
        .replace('${branch}', ocsafety(branchName))
        .replace('${project}', ocsafety(project.name))
    : ocsafety(`${project.name}-${branchName}`);

    const data: removeData = {
      projectName: project.name,
      pullrequestNumber: body.pullrequest.id,
      pullrequestTitle: body.pullrequest.title,
      branch: branchName,
      openshiftProjectName: openshiftProjectName,
      type: 'pullrequest'
    }

    try {
      await createRemoveTask(data);
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
