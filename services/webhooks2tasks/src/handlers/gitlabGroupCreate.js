// @flow

const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { getGroup } = require('@lagoon/commons/src/gitlabApi');
const { addGroup, addGroupWithParent } = require('@lagoon/commons/src/api');

import type { WebhookRequestData } from '../types';

async function gitlabGroupCreate(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const group = await getGroup(body.group_id);
    const { id, path: name, description: comment, full_path: hierarchy } = group;

    const meta = {
      data: group,
      gitlab_group_id: id
    };

    const hierarchyArray = hierarchy.split("/");
    // if the array has more then one entry, we have a hierarchy of groups,
    // Keycloak only needs to know the direct parent of the group, loading that one
    if (hierarchyArray.length > 1) {
      const groupParentName = hierarchyArray.slice(-2)[0]; // load second last entry of the array
      await addGroupWithParent(name, groupParentName);
    } else {
      await addGroup(name);
    }

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Created group ${name}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not create group, reason: ${error}`
    );

    return;
  }
}

module.exports = gitlabGroupCreate;
