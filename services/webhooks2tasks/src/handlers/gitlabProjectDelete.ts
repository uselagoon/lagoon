import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { deleteProject } from '@lagoon/commons/dist/api';

import { WebhookRequestData } from '../types';

export async function gitlabProjectDelete(webhook: WebhookRequestData) {
  const {
    webhooktype,
    event,
    uuid,
    body,
    body: { path: name }
  } = webhook;

  try {
    const meta = {
      project: name
    };

    await deleteProject(name);

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `deleted project ${name}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not delete project, reason: ${error}`
    );

    return;
  }
}
