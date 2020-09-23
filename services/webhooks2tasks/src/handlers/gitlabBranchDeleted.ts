import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { createRemoveTask } from '@lagoon/commons/dist/tasks';
import { getOpenShiftInfoForProject } from '@lagoon/commons/dist/api';

import { WebhookRequestData, removeData, Project } from '../types';

export async function gitlabBranchDeleted(webhook: WebhookRequestData, project: Project) {

    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
    } = webhook;

    const meta: { [key: string]: any } = {
      branch: body.ref.replace('refs/heads/',''),
      branchName: body.ref.replace('refs/heads/',''),
      projectName: project.name,
      repoFullName: body.project.path_with_namespace,
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

    const data: removeData = {
      projectName: project.name,
      branch: meta.branch,
      branchName: meta.branchName,
      openshiftProjectName: openshiftProjectName,
      forceDeleteProductionEnvironment: false,
      type: 'branch'
    }

    try {
      await createRemoveTask(data);
      // we are hardcoding the event type here as gitlab only knows them as a `push` with a all-zero sha
      sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:remove:handled`, meta,
        `*[${project.name}]* \`${meta.branch}\` deleted in <${body.project.http_url}|${body.project.path_with_namespace}>`
      )
      return;
    } catch (error) {
      meta.error = error
      switch (error.name) {
        case "ProjectNotFound":
        case "NoActiveSystemsDefined":
        case "UnknownActiveSystem":
          // These are not real errors and also they will happen many times. We just log them locally but not throw an error
          sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:remove:handledButNoTask`, meta,
            `*[${project.name}]* \`${meta.branch}\` deleted. No remove task created, reason: ${error}`
          )
          return;

        case "CannotDeleteProductionEnvironment":
          // These are not real errors and also they will happen many times. We just log them locally but not throw an error
          sendToLagoonLogs('warning', project.name, uuid, `${webhooktype}:remove:CannotDeleteProductionEnvironment`, meta,
            `*[${project.name}]* \`${meta.branch}\` not deleted. ${error}`
          )
          return;

        default:
          // Other messages are real errors and should reschedule the message in RabbitMQ in order to try again
          throw error
      }
    }

}
