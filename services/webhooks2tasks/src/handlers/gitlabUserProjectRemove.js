// @flow
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { removeUserFromProject } = require('@lagoon/commons/src/api');

import type { WebhookRequestData } from '../types';

async function gitlabUserProjectRemove(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const { project_path: project, user_id: user } = body;

    const meta = {
      data: body,
      user,
      project,
    };

    await removeUserFromProject(user, project);

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Removed user ${user} from project ${project}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not remove user from project, reason: ${error}`
    );

    return;
  }
}

module.exports = gitlabUserProjectRemove;
