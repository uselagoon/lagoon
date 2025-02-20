import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { createRemoveTask } from '@lagoon/commons/dist/tasks';
import { getOpenShiftInfoForProject } from '@lagoon/commons/dist/api';

import { WebhookRequestData, Project } from '../types';
import { DeployType, RemoveData } from '@lagoon/commons/dist/types';

export async function bitbucketBranchDeleted(webhook: WebhookRequestData, project: Project) {

    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
    } = webhook;

    const meta: { [key: string]: any } = {
      branch: body.push.changes[0].old.name,
      branchName: body.push.changes[0].old.name,
      projectName: project.name,
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

    let openshiftProjectName = projectOpenShift.openshiftProjectPattern
    ? projectOpenShift.openshiftProjectPattern
        .replace('${branch}', ocsafety(meta.branch))
        .replace('${project}', ocsafety(project.name))
    : ocsafety(`${project.name}-${meta.branch}`);

    const data: RemoveData = {
      projectName: project.name,
      branch: meta.branch,
      branchName: meta.branchName,
      openshiftProjectName: openshiftProjectName,
      forceDeleteProductionEnvironment: false,
      type: DeployType.BRANCH
    }

    try {
      await createRemoveTask(data);
      // setting the event type manually so that further systems know that it is a delete
      sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:delete:handled`, meta,
        `*[${project.name}]* \`${meta.branch}\` deleted in <${body.repository.links.html.href}|${body.repository.full_name}>`
      )
      return;
    } catch (error) {
      meta.error
      switch (error.name) {
        case "ProjectNotFound":
          // These are not real errors and also they will happen many times. We just log them locally but not throw an error
          sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:handledButNoTask`, meta,
            `*[${project.name}]* \`${meta.branch}\` deleted. No remove task created, reason: ${error}`
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
