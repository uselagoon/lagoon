// @flow

const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { getProject } = require('@lagoon/commons/src/gitlabApi');
const {
  addProject,
  updateProject,
  deleteProject
} = require('@lagoon/commons/src/api');

import type { WebhookRequestData } from '../types';

async function gitlabProjectUpdate(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const project = await getProject(body.project_id);
    console.log(project);
    const { id, path: name, ssh_url_to_repo: gitUrl, namespace } = project;

    // TODO: figure out openshift id
    const openshift = 1;

    const meta = {
      data: project,
      project: name
    };

    // Project was transferred from a group namespace to a non-group namespace
    if (namespace.kind != 'group') {
      await deleteProject(name);

      sendToLagoonLogs(
        'info',
        '',
        uuid,
        `${webhooktype}:${event}:unhandled`,
        meta,
        `Deleted project ${name}: not in group namespace`
      );

      return;
    }

    const response = await updateProject(id, {
      name,
      gitUrl,
      customer: namespace.id
    });

    // Project was transferred from a non-group namespace to a group namespace
    if (!response.updateProject) {
      await addProject(name, namespace.id, gitUrl, openshift, id);

      sendToLagoonLogs(
        'info',
        '',
        uuid,
        `${webhooktype}:${event}:handled`,
        meta,
        `Added project ${name}: transfer to group namespace`
      );

      return;
    }

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Updated project ${name}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not update project, reason: ${error}`
    );

    return;
  }
}

module.exports = gitlabProjectUpdate;
