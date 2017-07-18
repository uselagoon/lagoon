// @flow

import { logger } from '@amazeeio/amazeeio-local-logging';

import type { WebhookRequestData } from './types';

export type ChannelWrapper = {
  sendToQueue: (evt: string, data: Buffer, opts: Object) => void,
}

export default async function sendToAmazeeioWebhooks (args: WebhookRequestData, channelWrapper: ChannelWrapper): Promise<void> {
  const {
    webhooktype,
    event,
    giturl,
    uuid,
    body,
  } = args;

  try {
    const buffer = new Buffer(JSON.stringify(args));
    await channelWrapper.publish(`amazeeio-webhooks`, '', buffer, { persistent: true });

    logger.verbose(`Success send to amazeeio-webhooks ${webhooktype}:${event}`, {
      webhooktype,
      event,
      uuid,
    });
  } catch(error) {
    logger.error(`Error queuing amazeeio-webhooks ${webhooktype}:${event}, error: ${error}`);
  }
}
