import R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { getUser } from '@lagoon/commons/dist/gitlabApi';
import { addUser } from '@lagoon/commons/dist/api';

import { WebhookRequestData } from '../types';

export async function gitlabUserCreate(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const user = await getUser(body.user_id);
    const { id, email, name, username }: { id: number, email: string, name: string, username: string } = user;

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

    await addUser(email, firstName, lastName, null, id);

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Created user ${email} ${id}`
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
