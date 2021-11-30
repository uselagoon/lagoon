import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { logger } from '@lagoon/commons/dist/local-logging';
import {
  getWebhookNotificationInfoForProject,
  getEnvironmentById
} from '@lagoon/commons/dist/api';
import {
  notificationIntToContentType,
  notificationContentTypeToInt,
  parseProblemNotification
} from '@lagoon/commons/dist/notificationCommons';
import { URL } from 'url';
import http from 'https';
import { GetTypeEventMap } from '@lagoon/commons/dist/event-types';

export async function readFromRabbitMQ(
  msg: ConsumeMessage,
  channelWrapperLogs: ChannelWrapper
): Promise<void> {
  const logMessage = JSON.parse(msg.content.toString());

  const { severity, project, uuid, event, meta, message } = logMessage;

  const appId = msg.properties.appId || '';

  logger.verbose(`received ${event} for project ${project}`);

  const eventTypes = GetTypeEventMap();

  switch (eventTypes.get(event)) {
    case 'deployFinished':
    case 'removeFinished':
    case 'deployError':
      let payload = {
        type: 'DEPLOYMENT',
        event: event.split(':').pop(),
        project,
        environment: ''
      };
      if (meta && meta.environmentId) {
        const environmentDetails = await getEnvironmentById(meta.environmentId);
        payload.environment = environmentDetails.environmentById.name;
      }
      sendToWebhook(event, project, payload, channelWrapperLogs, msg);
      break;
    default:
      return channelWrapperLogs.ack(msg);
    break;
  }
}

const sendToWebhook = async (
  event,
  project,
  payload,
  channelWrapperLogs,
  msg
) => {
  let projectWebhooks;
  try {
    projectWebhooks = await getWebhookNotificationInfoForProject(
      project,
      'DEPLOYMENT'
    );
  } catch (error) {
    logger.error(`No Webhook information found, error: ${error}`);
    return channelWrapperLogs.ack(msg);
  }

  projectWebhooks.forEach(projectWebhook => {
    const { webhook } = projectWebhook;
    const webhookUrl = new URL(webhook);

    var data = JSON.stringify(payload);

    var options = {
      hostname: webhookUrl.host,
      port: webhookUrl.port,
      path: webhookUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    var req = http.request(options, function(res) {
      res.setEncoding('utf8');
    });

    req.on('error', function(e) {
      logger.error(`problem with request: ${e.message}`);
    });
    req.end(data);
  });

  channelWrapperLogs.ack(msg);
  return;
};
