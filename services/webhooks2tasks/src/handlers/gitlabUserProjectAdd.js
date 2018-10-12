// @flow
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { addUserToProject } = require('@lagoon/commons/src/api');

import type { WebhookRequestData } from '../types';

async function gitlabUserProjectAdd(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const { project_path: project, user_id: user } = body;

    const meta = {
      data: body,
      user,
      project,
    };

    await addUserToProject(user, project);

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Added user ${user} to project ${project}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not add user to project, reason: ${error}`
    );

    return;
  }
}

module.exports = gitlabUserProjectAdd;
