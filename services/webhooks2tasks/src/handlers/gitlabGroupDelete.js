// @flow

const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { deleteGroup } = require('@lagoon/commons/src/api');

import type { WebhookRequestData } from '../types';

async function gitlabGroupDelete(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const { path: name, group_id: id } = body;

    const meta = {
      path: name,
      group_id: id,
    };


    // @TODO: Implement Group Deletion by Name
    return;
    // await deleteGroup(name);

    // sendToLagoonLogs(
    //   'info',
    //   '',
    //   uuid,
    //   `${webhooktype}:${event}:handled`,
    //   meta,
    //   `Deleted group ${name}`
    // );

    // return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not delete group ${name}, reason: ${error}`
    );

    return;
  }
}

module.exports = gitlabGroupDelete;
