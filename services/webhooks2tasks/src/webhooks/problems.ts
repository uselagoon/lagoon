// @flow

import uuid4 from 'uuid4';
import { logger } from '@lagoon/commons/dist/local-logging';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { harborScanningCompleted } from '../handlers/problems/harborScanningCompleted';
import { processHarborVulnerabilityList } from '../handlers/problems/processHarborVulnerabilityList';
import { processDrutinyResultset }  from '../handlers/problems/processDrutinyResults';

import {
  WebhookRequestData,
  Project
} from '../types';

export async function processProblems(
    rabbitMsg,
    channelWrapperWebhooks
  ): Promise<void> {
    const webhook: WebhookRequestData = JSON.parse(rabbitMsg.content.toString());
    const {
      webhooktype,
      event
    } = webhook;

    switch(webhook.event) {
      case 'harbor:scanningcompleted' :
        await handle(harborScanningCompleted, webhook, `${webhooktype}:${event}`, channelWrapperWebhooks);
        break
      case 'harbor:scanningresultfetched' :
        await handle(processHarborVulnerabilityList, webhook, `${webhooktype}:${event}`, channelWrapperWebhooks);
      break;
      case 'drutiny:resultset' :
        await handle(processDrutinyResultset, webhook, `${webhooktype}:${event}`, channelWrapperWebhooks);
      break;
    }
    channelWrapperWebhooks.ack(rabbitMsg);
};

async function handle(handler, webhook: WebhookRequestData, fullEvent: string, channelWrapperWebhooks) {
  const {
    uuid
  } = webhook;

  logger.info(`Handling ${fullEvent}`, {
    uuid
  });

  try {
    await handler(webhook, channelWrapperWebhooks);
  } catch (error) {
    logger.error(`Error handling ${fullEvent}`);
    logger.error(error);
  }
}

async function unhandled(webhook: WebhookRequestData, fullEvent: string) {
  const {
    uuid
  } = webhook;

  const meta = {
    fullEvent: fullEvent
  };
  sendToLagoonLogs(
    'info',
    '',
    uuid,
    `unhandledWebhook`,
    meta,
    `Unhandled webhook ${fullEvent}`
  );
  return;
}
