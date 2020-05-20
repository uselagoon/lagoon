// @flow

const { sendToLagoonLogs } = require('@lagoon/commons/dist/logs');
const { deleteGroup, sanitizeGroupName } = require('@lagoon/commons/dist/api');

import type { WebhookRequestData } from '../types';

async function gitlabGroupDelete(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const { path: name, group_id: id, full_path } = body;

    const meta = {
      path: name,
      group_id: id,
    };

    await deleteGroup(sanitizeGroupName(full_path));

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Deleted group ${name}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not delete group, reason: ${error}`
    );

    return;
  }
}

module.exports = gitlabGroupDelete;
