// @flow

const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { getProject } = require('@lagoon/commons/src/gitlabApi');
const { addProject, addGroupToProject } = require('@lagoon/commons/src/api');

import type { WebhookRequestData } from '../types';

async function gitlabProjectCreate(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const project = await getProject(body.project_id);
    const { id, path: projectName, ssh_url_to_repo: gitUrl, namespace } = project;

    // TODO: figure out openshift id
    const openshift = 1;

    // set production environment to default master
    const productionenvironment = "master";

    const meta = {
      data: project,
      project: projectName
    };

    if (namespace.kind != 'group') {
      sendToLagoonLogs(
        'info',
        '',
        uuid,
        `${webhooktype}:${event}:unhandled`,
        meta,
        `Skipping creation of project ${projectName}: not in group namespace`
      );

      return;
    }

    await addProject(projectName, gitUrl, openshift, productionenvironment);

    // In Gitlab each project has an Owner, which is in this case a Group that already should be created before.
    // We add this owner Group to the Project.
    await addGroupToProject(projectName, namespace.path);

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Created project ${projectName}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not create project, reason: ${error}`
    );

    return;
  }
}

module.exports = gitlabProjectCreate;
