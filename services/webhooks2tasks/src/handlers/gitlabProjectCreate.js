// @flow

const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { getProject } = require('@lagoon/commons/src/gitlabApi');
const { addProject } = require('@lagoon/commons/src/api');

import type { WebhookRequestData } from '../types';

async function gitlabProjectCreate(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const project = await getProject(body.project_id);
    const { id, path: name, ssh_url_to_repo: gitUrl, namespace } = project;

    // TODO: figure out openshift id
    const openshift = 1;

    const meta = {
      data: project,
      project: name
    };

    if (namespace.kind != 'group') {
      sendToLagoonLogs(
        'info',
        '',
        uuid,
        `${webhooktype}:${event}:unhandled`,
        meta,
        `Skipping creation of project ${name}: not in group namespace`
      );

      return;
    }

    await addProject(name, namespace.id, gitUrl, openshift, id);

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Created project ${name}`
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
