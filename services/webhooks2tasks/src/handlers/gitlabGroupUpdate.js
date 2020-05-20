// @flow

const { sendToLagoonLogs } = require('@lagoon/commons/dist/logs');
const { getGroup } = require('@lagoon/commons/dist/gitlabApi');
const { updateGroup, sanitizeGroupName } = require('@lagoon/commons/dist/api');

import type { WebhookRequestData } from '../types';

async function gitlabGroupUpdate(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const group = await getGroup(body.group_id);
    const { id, path: name, full_path } = group;
    const { old_full_path } = body;

    const meta = {
      data: group,
      group: id
    };

    await updateGroup(sanitizeGroupName(old_full_path), {
      name: sanitizeGroupName(full_path)
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
