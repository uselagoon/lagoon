import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { removeUserFromGroup } from '@lagoon/commons/dist/api';

import { WebhookRequestData } from '../types';

export async function gitlabUserProjectRemove(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const { project_path: projectName, user_id: userId, user_email: userEmail } = body;

    const meta = {
      data: body,
      projectName,
      userId,
      userEmail
    };

    // In Gitlab you can add/remove Users to Projects, in Lagoon this is not directly possible, but instead
    // Lagoon automatically creates a group for each project in this form: `project-$projectname`
    // So if a User is removed from a Project in Gitlab, we remove the user from this group
    await removeUserFromGroup(userEmail, `project-${projectName}`);

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Removed user ${userEmail} ${userId} from group project-${projectName}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not remove user from group project, reason: ${error}`
    );

    return;
  }
}
