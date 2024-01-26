import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { removeUserFromGroup, sanitizeGroupName } from '@lagoon/commons/dist/api';
import { getGroup, getUser } from '@lagoon/commons/dist/gitlab/api';

import { WebhookRequestData } from '../types';

export async function gitlabUserGroupRemove(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  let group;
  try {
    group = await getGroup(body.group_id);
  } catch (err) {
    if (err.message === '404 Group Not Found') {
      // Group was deleted, no need to manually remove user
      return;
    }

    throw err;
  }

  try {
    const { group_path: groupName, user_id: gitlabUserId } = body;

    const gitlabUser = await getUser(gitlabUserId);
    const { email: userEmail } = gitlabUser;

    const meta = {
      data: body,
      userEmail,
      gitlabUserId,
      groupName,
    };

    await removeUserFromGroup(userEmail, sanitizeGroupName(group.full_path));

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
