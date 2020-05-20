// @flow

const R = require('ramda');
const { sendToLagoonLogs } = require('@lagoon/commons/dist/logs');
const { getSshKey } = require('@lagoon/commons/dist/gitlabApi');
const { addSshKey } = require('@lagoon/commons/dist/api');

import type { WebhookRequestData } from '../types';

async function gitlabSshKeyAdd(webhook: WebhookRequestData) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    const { id } = body;
    const sshKey = await getSshKey(id);
    const {
      title: name,
      key,
      user: { id: userId, email: user_email },
    } = sshKey;

    const meta = {
      data: body,
      key: id,
      user: userId
    };

    // Gitlab suggests keys in the format "{algorithm} {key} {comment}" but users
    // can force any string to be saved.
    const keyParts = key.split(' ');
    const algorithm = keyParts.shift();
    const keyValue = keyParts.shift();
    let keyType;

    switch (algorithm) {
      case 'ssh-rsa':
        keyType = 'SSH_RSA';
        break;

      case 'ssh-ed25519':
        keyType = 'SSH_ED25519';
        break;

      default:
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }

    await addSshKey(null, name, keyValue, keyType, user_email);

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:handled`,
      meta,
      `Added key to user ${user_email}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not add key to user, reason: ${error}`
    );

    return;
  }
}

module.exports = gitlabSshKeyAdd;
