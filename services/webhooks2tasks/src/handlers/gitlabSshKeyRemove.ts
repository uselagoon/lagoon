import R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { getUserBySshKey, deleteSshKey } from '@lagoon/commons/dist/api';

import { WebhookRequestData } from '../types';

export async function gitlabSshKeyRemove(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const { id, key, username } = body;

    const user = await getUserBySshKey(key);
    const {
      userBySshKey: { id: userId, sshKeys }
    } = user;

    const meta = {
      data: body,
      key: id,
      user: userId
    };

    const name = R.head(
      R.map(R.prop('name'), sshKeys.filter(sshKey => sshKey.id == id))
    );

    await deleteSshKey(name);

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Deleted key ${id}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not delete key, reason: ${error}`
    );

    return;
  }
}
