// @flow
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { addUserToCustomer } = require('@lagoon/commons/src/api');

import type { WebhookRequestData } from '../types';

async function gitlabUserCustomerAdd(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const { group_path: customer, user_id: user } = body;

    const meta = {
      data: body,
      user,
      customer,
    };

    await addUserToCustomer(user, customer);

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Added user ${user} to customer ${customer}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not add user to customer, reason: ${error}`
    );

    return;
  }
}

module.exports = gitlabUserCustomerAdd;
