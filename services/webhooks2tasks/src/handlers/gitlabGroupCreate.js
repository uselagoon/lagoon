// @flow

const { logger } = require('@lagoon/commons/src/local-logging');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { addCustomer } = require('@lagoon/commons/src/api');

import type { WebhookRequestData, ChannelWrapper  } from '../types';

async function gitlabGroupCreate(webhook: WebhookRequestData) {

    const {
      webhooktype,
      event,
      uuid,
      body,
    } = webhook;

    try {
      const result = await addCustomer(body.path, body.group_id);
      sendToLagoonLogs('info', '', uuid, `${webhooktype}:${event}:handled`, {},
        `Created customer ${body.path}`
      )
      return;
    } catch (error) {
      sendToLagoonLogs('warning', '', uuid, `${webhooktype}:${event}:unhandled`, {},
        `Could not create customer ${body.path}, reason: ${error}`
      );
      return;
    }
}

module.exports = gitlabGroupCreate;
