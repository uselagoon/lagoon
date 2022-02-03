import { connect } from 'amqp-connection-manager';
import { logger } from './local-logging';

const rabbitmqHost = process.env.RABBITMQ_HOST || 'broker';
const rabbitmqUsername = process.env.RABBITMQ_USERNAME || 'guest';
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD || 'guest';

let channelWrapperLogs;

export function initSendToLagoonLogs() {
  const connection = connect(
    [`amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}`],
    // @ts-ignore
    { json: true }
  );

  connection.on('connect', ({ url }) =>
    logger.verbose('lagoon-logs: Connected to %s', url, {
      action: 'connected',
      url
    })
  );
  connection.on('disconnect', params =>
    // @ts-ignore
    logger.error('lagoon-logs: Not connected, error: %s', params.err.code, {
      action: 'disconnected',
      reason: params
    })
  );

  // Cast any to ChannelWrapper to get type-safetiness through our own code
  channelWrapperLogs = connection.createChannel({
    setup: channel =>
      Promise.all([
        channel.assertExchange('lagoon-logs', 'direct', { durable: true })
      ])
  });
}

export async function sendToLagoonLogs(
  severity: string,
  project: string,
  uuid: string,
  event: string,
  meta: any,
  message: string,
  level?: string
): Promise<void> {
  const payload = {
    severity,
    project,
    uuid,
    event,
    meta,
    message,
    level
  };

  try {
    const buffer = Buffer.from(JSON.stringify(payload));
    const packageName = process.env.npm_package_name || '';
    const options = {
      persistent: true,
      appId: packageName
    };
    await channelWrapperLogs.publish('lagoon-logs', '', buffer, options);

    logger.log(severity, `lagoon-logs: Send to lagoon-logs: ${message}`);
  } catch (error) {
    logger.error(
      `lagoon-logs: Error send to rabbitmq lagoon-logs exchange, error: ${error}`
    );
  }
}
