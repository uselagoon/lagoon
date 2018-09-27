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
    var { id, path: name, ssh_url_to_repo: gitUrl, namespace } = project;
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

  const meta = {
    data: project,
    project: name
  };

  // Project was transferred from a group namespace to a non-group namespace
  if (namespace.kind != 'group') {
    try {
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
      name,
      gitUrl,
      customer: namespace.id
    });

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
    try {
      // TODO: figure out openshift id
      const openshift = 1;

      // Project was transferred from a non-group namespace to a group namespace
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
