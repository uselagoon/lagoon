// @flow
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { removeUserFromCustomer } = require('@lagoon/commons/src/api');

import type { WebhookRequestData } from '../types';

async function gitlabUserCustomerRemove(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const { group_path: customer, user_id: user } = body;

    const meta = {
      data: body,
      user,
      customer,
    };

    await removeUserFromCustomer(user, customer);

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Removed user ${user} from customer ${customer}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not remove user from customer, reason: ${error}`
    );

    return;
  }
}

module.exports = gitlabUserCustomerRemove;
