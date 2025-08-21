import { ChannelWrapper } from 'amqp-connection-manager';
import { logger } from '@lagoon/commons/dist/logs/local-logger';
import { WebhookRequestData } from './types';

export async function sendToLagoonWebhooks (args: WebhookRequestData, channelWrapperWebhooks: ChannelWrapper): Promise<void> {
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
