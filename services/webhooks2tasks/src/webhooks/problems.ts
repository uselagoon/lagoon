// @flow

import uuid4 from 'uuid4';
import { logger } from '@lagoon/commons/dist/logs/local-logger';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { processDrutinyResultset }  from '../handlers/problems/processDrutinyResults';

import {
  WebhookRequestData,
  Project
} from '../types';

// NOTE: Here we are going through the process of deprecating the Trivy integration
const enableHarborIntegration = (() => {
	if(process.env.ENABLE_DEPRECATED_TRIVY_INTEGRATION && process.env.ENABLE_DEPRECATED_TRIVY_INTEGRATION == "true") {
    console.log("ENABLE_DEPRECATED_TRIVY_INTEGRATION is 'true' -- enabling Harbor/Trivy");
		return true;
	}
  console.log("ENABLE_DEPRECATED_TRIVY_INTEGRATION is not 'true' -- Harbor/Trivy integration is not enabled");
	return false;
})();

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
    logger.error(`Error handling ${fullEvent}: ${error.message}`);
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
