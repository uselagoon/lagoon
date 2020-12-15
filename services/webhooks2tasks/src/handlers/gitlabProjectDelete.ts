import R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { allProjectsInGroup, deleteProject, sanitizeGroupName } from '@lagoon/commons/dist/api';

import { WebhookRequestData } from '../types';

export async function gitlabProjectDelete(webhook: WebhookRequestData) {
  const {
    webhooktype,
    event,
    uuid,
    body,
    body: { path: projectName, path_with_namespace }
  } = webhook;

  try {
    const meta = {
      project: projectName
    };

    const groupName = sanitizeGroupName(path_with_namespace.replace(`/${projectName}`, ''));
    const projectsInGroup = await allProjectsInGroup({ name: groupName });
    const projectExists = R.pipe(
      R.prop('allProjectsInGroup'),
      R.pluck('name'),
      R.contains(projectName),
    // @ts-ignore
    )(projectsInGroup);

    if (projectExists) {
      await deleteProject(projectName);

      sendToLagoonLogs(
        'info',
        '',
        uuid,
        `${webhooktype}:${event}:handled`,
        meta,
        `deleted project ${projectName}`
      );

      return;
    }

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `project "${projectName}" not a member of group "${groupName}"`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not delete project, reason: ${error}`
    );

    return;
  }
}
