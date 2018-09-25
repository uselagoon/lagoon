// @flow

const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { deleteCustomer } = require('@lagoon/commons/src/api');

import type { WebhookRequestData } from '../types';

async function gitlabGroupDelete(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const { path: name, group_id: id } = body;

    const meta = {
      customer: id
    };

    await deleteCustomer(name);

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Deleted customer ${name}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not delete customer, reason: ${error}`
    );

    return;
  }
}

module.exports = gitlabGroupDelete;
