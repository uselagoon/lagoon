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
    var project = await getProject(body.project_id);
    var { id, path: projectName, ssh_url_to_repo: gitUrl, namespace } = project;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not get project info from Gitlab, reason: ${error}`
    );

    return;
  }

  const meta = {
    data: project,
    project: projectName
  };

  // Project was transferred from a group namespace to a non-group namespace
  if (namespace.kind != 'group') {
    try {
      await deleteProject(projectName);

      sendToLagoonLogs(
        'info',
        '',
        uuid,
        `${webhooktype}:${event}:unhandled`,
        meta,
        `Deleted project ${projectName}: not in group namespace anymore`
      );

      return;
    } catch (error) {
      sendToLagoonLogs(
        'error',
        '',
        uuid,
        `${webhooktype}:${event}:unhandled`,
        meta,
        `Could not delete project, reason: ${error}`
      );

      return;
    }
  }

  try {
    const response = await updateProject(id, {
      projectName,
      gitUrl,
      customer: namespace.id
    });

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Updated project ${projectName}`
    );

    return;
  } catch (error) {
    try {
      // TODO: figure out openshift id
      const openshift = 1;

      // set production environment to default master
      const productionenvironment = "master";

      // Project was transferred from a non-group namespace to a group namespace, we add a new project
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
        `Added project ${projectName}: transfer to group namespace`
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
}

module.exports = gitlabProjectUpdate;
