// @flow


const uuid4 = require('uuid4');
const { logger } = require('@lagoon/commons/src/local-logging');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const addAProblem = require('../handlers/problems/addProblem');
const harborScanningCompleted = require('../handlers/problems/harborScanningCompleted');
const processHarborVulnerabilityList = require('../handlers/problems/processHarborVulnerabilityList');


import type {
  WebhookRequestData,
  ChannelWrapper,
  RabbitMQMsg,
  Project
} from './types';


async function processProblems(
    rabbitMsg: RabbitMQMsg,
    channelWrapperWebhooks: ChannelWrapper
  ): Promise<void> {
    const webhook: WebhookRequestData = JSON.parse(rabbitMsg.content.toString());
    //webhook.body = testData; //Just dropping this here TODO remove later

    const {
      webhooktype,
      event
    } = webhook;

    switch(webhook.event) {
      case 'harbor:scanningcompleted' :
        //TODO: here we're going to be doing the actual scanning connection and setting up a new set of items
        await handle(harborScanningCompleted, webhook, `${webhooktype}:${event}`, channelWrapperWebhooks);
        break
      case 'harbor:scanningresultfetched' :
        await handle(processHarborVulnerabilityList, webhook, `${webhooktype}:${event}`, channelWrapperWebhooks);
      break;
    }
    channelWrapperWebhooks.ack(rabbitMsg);
};

async function handle(handler, webhook: WebhookRequestData, fullEvent: string, channelWrapperWebhooks: ChannelWrapper) {
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

module.exports = processProblems;