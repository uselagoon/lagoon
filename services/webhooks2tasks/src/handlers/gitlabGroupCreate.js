// @flow

const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { getGroup } = require('@lagoon/commons/src/gitlabApi');
const { addCustomer } = require('@lagoon/commons/src/api');

const GITLAB_DEFAULT_CUSTOMER_SSH_PRIVATEKEY = process.env.GITLAB_DEFAULT_CUSTOMER_SSH_PRIVATEKEY || null;
import type { WebhookRequestData } from '../types';

async function gitlabGroupCreate(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const group = await getGroup(body.group_id);
    const { id, path: name, description: comment } = group;

    const meta = {
      data: group,
      customer: id
    };

    await addCustomer(name, id, comment, GITLAB_DEFAULT_CUSTOMER_SSH_PRIVATEKEY);

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Created customer ${name}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not create customer, reason: ${error}`
    );

    return;
  }
}

module.exports = gitlabGroupCreate;
