import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { addUserToGroup } from '@lagoon/commons/dist/api';

import { WebhookRequestData } from '../types';

export async function gitlabUserProjectAdd(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;
  const { project_path: projectName, user_id: userId, user_email: userEmail, access_level: role } = body;

  try {
    const meta = {
      data: body,
      userId,
      userEmail,
      projectName,
      role,
    };

    // In Gitlab you can add Users to Projects, in Lagoon this is not directly possible, but instead
    // Lagoon automatically creates a group for each project in this form: `project-$projectname`
    // So if a User is added to a Project in Gitlab, we add the user to this group
    await addUserToGroup(userEmail, `project-${projectName}`, role.toUpperCase());

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Added user ${userEmail} ${userId} to group project-${projectName}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not add user to group project, reason: ${error}`
    );

    return;
  }
}
