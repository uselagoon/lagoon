import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { deleteUser } from '@lagoon/commons/dist/api';

import { WebhookRequestData } from '../types';

export async function gitlabUserDelete(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const { user_id: id, email } = body;

    const meta = {
      user: id
    };

    await deleteUser(email);

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Deleted user ${id}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not delete user, reason: ${error}`
    );

    return;
  }
}
