// @flow
const retry = require('async-retry')

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

    // Retry adding the User to the Customer 5 times as during the creation of a new Group the customer is immediatelly added and the webhook sent at the same time
    await retry(async () => {
      await addUserToCustomer(user, customer);
    }, {
      retries: 5,
    })

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
