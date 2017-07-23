// @flow

const { logger } = require('@amazeeio/lagoon-commons/src/local-logging');

import type { WebhookRequestData } from './types';

export type ChannelWrapper = {
  sendToQueue: (evt: string, data: Buffer, opts: Object) => void,
}

export async function sendToAmazeeioWebhooks (args: WebhookRequestData, channelWrapperWebhooks: ChannelWrapper): Promise<void> {
  const {
    webhooktype,
    event,
    giturl,
    uuid,
    body,
  } = args;

  try {
    const buffer = new Buffer(JSON.stringify(args));
    await channelWrapperWebhooks.publish(`amazeeio-webhooks`, '', buffer, { persistent: true });

    logger.verbose(`Success send to amazeeio-webhooks ${webhooktype}:${event}`, {
      webhooktype,
      event,
      uuid,
    });
  } catch(error) {
    logger.error(`Error queuing amazeeio-webhooks ${webhooktype}:${event}, error: ${error}`);
  }
}
