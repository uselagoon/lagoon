// @flow

const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { getGroup } = require('@lagoon/commons/src/gitlabApi');
const { updateGroup } = require('@lagoon/commons/src/api');

import type { WebhookRequestData } from '../types';

async function gitlabGroupUpdate(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const group = await getGroup(body.group_id);
    const { id, path: name, description: comment } = group;
    const { old_path: oldName } = body;

    const meta = {
      data: group,
      group: id
    };

    await updateGroup(oldName, {
      name
    });

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Updated group ${name}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not update group, reason: ${error}`
    );

    return;
  }
}

module.exports = gitlabGroupUpdate;
