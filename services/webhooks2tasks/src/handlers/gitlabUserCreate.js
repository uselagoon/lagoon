// @flow
const R = require('ramda');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { getUser } = require('@lagoon/commons/src/gitlabApi');
const { addUser } = require('@lagoon/commons/src/api');

import type { WebhookRequestData } from '../types';

async function gitlabUserCreate(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const user = await getUser(body.user_id);
    const { id, email, name, username } = user;

    const meta = {
      data: user,
      user: id
    };

    let firstName = name,
      lastName;
    if (name.includes(' ')) {
      const nameParts = name.split(' ');
      firstName = R.head(nameParts);
      lastName = R.tail(nameParts).join(' ');
    }

    const data = {
      sync_source: 'gitlab',
      sync_gitlab: {
        userId: id,
        userName: username,
      },
    };

    await addUser(id, email, firstName, lastName, null, JSON.stringify(data));

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Created user ${email}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not create user, reason: ${error}`
    );

    return;
  }
}

module.exports = gitlabUserCreate;
