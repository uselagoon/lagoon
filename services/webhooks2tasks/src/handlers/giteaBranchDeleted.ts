import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { createRemoveTask, makeSafe } from '@lagoon/commons/dist/tasks';
import { getOpenShiftInfoForProject } from '@lagoon/commons/dist/api';

import { WebhookRequestData, Project } from '../types';
import { DeployType, RemoveData } from '@lagoon/commons/dist/types';

export async function giteaBranchDeleted(webhook: WebhookRequestData, project: Project) {
    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
    } = webhook;

    const meta: { [key: string]: any } = {
      projectName: project.name,
      branch: body.ref.replace('refs/heads/',''),
      branchName: body.ref.replace('refs/heads/','')
    }

    if (project.deploymentsDisabled == 1) {
      sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:handledButNoTask`, meta,
        `*[${project.name}]* No deploy task created, reason: deployments are disabled`
      )
      return;
    }

    const result = await getOpenShiftInfoForProject(project.name);
    const projectOpenShift = result.project;

    let openshiftProjectName = makeSafe(`${project.name}-${meta.branch}`);

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
      sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:delete:handled`, meta,
        `*[${project.name}]* \`${meta.branch}\` deleted in <${body.repository.html_url}|${body.repository.full_name}>`
      )
      return;
    } catch (error) {
      meta.error = error
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
