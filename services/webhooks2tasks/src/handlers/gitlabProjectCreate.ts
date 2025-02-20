import R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { getProject, addDeployKeyToProject } from '@lagoon/commons/dist/gitlab/api';
import { addProject, addGroupToProject, sanitizeGroupName } from '@lagoon/commons/dist/api';
import { validateKey } from '@lagoon/commons/dist/util/func';

import { WebhookRequestData } from '../types';

export async function gitlabProjectCreate(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const project = await getProject(body.project_id);
    const { id, path: projectName, ssh_url_to_repo: gitUrl, namespace } = project;

    // TODO: figure out openshift id
    const openshift = 1;

    // set production environment to default master
    const productionenvironment = "master";

    const meta = {
      data: project,
      project: projectName
    };

    if (namespace.kind != 'group') {
      sendToLagoonLogs(
        'info',
        '',
        uuid,
        `${webhooktype}:${event}:unhandled`,
        meta,
        `Skipping creation of project ${projectName}: not in group namespace`
      );

      return;
    }

    const lagoonProject = await addProject(projectName, gitUrl, openshift, productionenvironment);

    try {
      const publickey = await validateKey(R.prop('privateKey', lagoonProject), "private")

      await addDeployKeyToProject(id, publickey['publickey']);
    } catch (err) {
      sendToLagoonLogs(
        'error',
        '',
        uuid,
        `${webhooktype}:${event}:deploy_key`,
        { data: body },
        `Could not add deploy_key to gitlab project ${id}, reason: ${err}`
      );
    }

    // In Gitlab each project has an Owner, which is in this case a Group that already should be created before.
    // We add this owner Group to the Project.
    await addGroupToProject(projectName, sanitizeGroupName(namespace.full_path));

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Created project ${projectName}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not create project, reason: ${error}`
    );

    return;
  }
}
