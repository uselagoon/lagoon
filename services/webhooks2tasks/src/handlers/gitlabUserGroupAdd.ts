import retry from 'async-retry';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { addUserToGroup, sanitizeGroupName } from '@lagoon/commons/dist/api';
import { getGroup } from '@lagoon/commons/dist/gitlabApi';

import { WebhookRequestData } from '../types';

export async function gitlabUserGroupAdd(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const group = await getGroup(body.group_id);
    const { group_path: groupName, user_id: gitlabUserId, user_email: userEmail, group_access: role } = body;

    const meta = {
      data: body,
      userEmail,
      gitlabUserId,
      groupName,
      role,
    };

    // Retry adding the User to the Customer 5 times as during the creation of a new Group the customer is immediatelly added and the webhook sent at the same time
    await retry(async () => {
      // Gitlab Group Access matches the Lagoon Roles, just need them Uppercase
      await addUserToGroup(userEmail, sanitizeGroupName(group.full_path), role.toUpperCase());
    }, {
      retries: 5,
    })

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Added user ${gitlabUserId} ${userEmail} to group ${groupName}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not add user to group , reason: ${error}`
    );

    return;
  }
}
