// @flow
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { removeUserFromGroup } = require('@lagoon/commons/src/api');

import type { WebhookRequestData } from '../types';

async function gitlabUserGroupRemove(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const { group_path: groupName, user_id: gitlabUserId, user_email: userEmail } = body;

    const meta = {
      data: body,
      userEmail,
      gitlabUserId,
      groupName,
    };

    await removeUserFromGroup(userEmail, groupName);

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Removed user ${gitlabUserId} ${userEmail} from group ${groupName}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not remove user from group, reason: ${error}`
    );

    return;
  }
}

module.exports = gitlabUserGroupRemove;
