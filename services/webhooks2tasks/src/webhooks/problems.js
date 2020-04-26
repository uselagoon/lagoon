// @flow


const uuid4 = require('uuid4');
const { logger } = require('@lagoon/commons/src/local-logging');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const addAProblem = require('../handlers/problems/addProblem');
const harborScanningCompleted = require('../handlers/problems/harborScanningCompleted');


import type {
  WebhookRequestData,
  ChannelWrapper,
  RabbitMQMsg,
  Project
} from './types';

// import convertDateToMYSQLDateTimeFormat from '../../../api/src/util/convertDateToMYSQLDateTimeFormat';



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
      case 'harbor:lastsplash' :
        //TODO: here we
      // break;
        console.log("crash, I'm the last splash!");
      break;
      case 'harbor:scanningcompleted' :
        //TODO: here we're going to be doing the actual scanning connection and setting up a new set of items
        await handle(harborScanningCompleted, webhook, `${webhooktype}:${event}`, channelWrapperWebhooks);
        break
      case 'harbor:scanningresultfetched' :
      //   for(const objKey in webhook.body) {


      //     if(webhook.body[objKey].vulnerabilities) {
      //       let vulnerabilities = webhook.body[objKey].vulnerabilities;
      //       //Should we test these objects against some kind of type? Can we?
      //       vulnerabilities.forEach(element => {
      //         //console.log(element.description);
      //         //TODO: convert trivy severity to our levels
      //         //TODO:
      //         try {
      //           addAProblem(null, 1, element.id, 'HIGH', 'harbor', null, JSON.stringify({description: element.description, links: element.links}));
      //           // console.log(element);
      //         }
      //        catch (error) {
      //           console.log(error);
      //        }

      //       });
      //     }
      // }
      try {
        const webhookData = generateWebhookData(webhook.giturl, 'problems', 'harbor:lastsplash', {message: 'last splash!!! 2'});
        const buffer = new Buffer(JSON.stringify(webhookData));
        await channelWrapperWebhooks.publish(`lagoon-webhooks`, '', buffer, { persistent: true });
      } catch(error) {
        logger.error(`Error queuing lagoon-webhooks harbor:harbor:lastsplash, error: ${error}`);
      }
      break;
    }
    channelWrapperWebhooks.ack(rabbitMsg);
};


const generateWebhookData = (webhookGiturl, webhooktype, event, body, id = null) => {
  return {
    webhooktype: webhooktype,
    event: event,
    giturl: webhookGiturl,
    uuid: id ? id : uuid4(),
    body: body
  }
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