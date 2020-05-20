// @flow

const { logger } = require('@lagoon/commons/dist/local-logging');

import type { WebhookRequestData } from './types';

export type ChannelWrapper = {
  publish: (string, string, Buffer, Object) => void,
  sendToQueue: (evt: string, data: Buffer, opts: Object) => void,
}

async function sendToLagoonWebhooks (args: WebhookRequestData, channelWrapperWebhooks: ChannelWrapper): Promise<void> {
  const {
    webhooktype,
    event,
    giturl,
    uuid,

  } = args;

  try {
    const buffer = new Buffer(JSON.stringify(args));
    await channelWrapperWebhooks.publish(`lagoon-webhooks`, '', buffer, { persistent: true });

    logger.verbose(`Success send to lagoon-webhooks ${webhooktype}:${event}`, {
      webhooktype,
      event,
      uuid,
    });
  } catch(error) {
    logger.error(`Error queuing lagoon-webhooks ${webhooktype}:${event}, error: ${error}`);
  }
}

module.exports = sendToLagoonWebhooks;
