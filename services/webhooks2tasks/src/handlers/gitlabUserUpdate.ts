import R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { getUser } from '@lagoon/commons/dist/gitlab/api';
import { updateUser } from '@lagoon/commons/dist/api';

import { WebhookRequestData } from '../types';

export async function gitlabUserUpdate(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const user = await getUser(body.user_id);
    const { id, email, name } = user;

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

    await updateUser(email, {
      email,
      firstName,
      lastName
    });

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Updated user ${name}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not update user, reason: ${error}`
    );

    return;
  }
}
