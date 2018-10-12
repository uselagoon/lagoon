// @flow

const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { getGroup } = require('@lagoon/commons/src/gitlabApi');
const { updateCustomer } = require('@lagoon/commons/src/api');

import type { WebhookRequestData } from '../types';

async function gitlabGroupUpdate(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const group = await getGroup(body.group_id);
    const { id, path: name, description: comment } = group;

    const meta = {
      data: group,
      customer: id
    };

    await updateCustomer(id, {
      name,
      comment
    });

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Updated customer ${name}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not update customer, reason: ${error}`
    );

    return;
  }
}

module.exports = gitlabGroupUpdate;
