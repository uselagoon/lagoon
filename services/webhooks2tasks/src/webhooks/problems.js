// @flow


const { logger } = require('@lagoon/commons/src/local-logging');
const { addProblem } = require('@lagoon/commons/src/api');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');


import type {
  WebhookRequestData,
  ChannelWrapper,
  RabbitMQMsg,
  Project
} from './types';

// import convertDateToMYSQLDateTimeFormat from '../../../api/src/util/convertDateToMYSQLDateTimeFormat';

const testData = require('./test_data');

// import convertDateToMYSQLDateTimeFormat from '../../../api/src/util/convertDateToMYSQLDateTimeFormat';

// async function processOther(
//   rabbitMsg: RabbitMQMsg,
//   channelWrapperWebhooks: ChannelWrapper
// ): Promise<void> {
//   const webhook: WebhookRequestData = JSON.parse(rabbitMsg.content.toString());

//   const { webhooktype, event } = webhook;
// }

// async function handle(handler, webhook: WebhookRequestData, fullEvent: string) {
//     const { uuid } = webhook;

//     logger.info(`Handling ${fullEvent}`, { uuid });

//     try {
//       //await handler(webhook);

//       //TODO: deal with harbor response
//       //we do this in parts, I suppose

//       const scanData = testData; //Let's assign this here for now while we're working with testing ...

//       // for(cost objKey in testData) {
//       //   if(testData[objKey].hasOwnProperty['vulnerabilities']) {
//       //     let vulnerabilities = testData[objKey].['vulnerabilities'];
//       //     //Should we test these objects against some kind of type? Can we?
//       //     console.log(vulnerabilities);

//       //   }
//       // }


//     } catch (error) {
//       logger.error(`Error handling ${fullEvent}`);
//       logger.error(error);
//     }
//   }
// }

// async function unhandled(webhook: WebhookRequestData, fullEvent: string) {
//     const { uuid } = webhook;

//     const meta = {
//       fullEvent: fullEvent
//     };
//     sendToLagoonLogs(
//       'info',
//       '',
//       uuid,
//       `unhandledWebhook`,
//       meta,
//       `Unhandled webhook ${fullEvent}`
//     );
//     return;
//   }

async function processProblems(
    rabbitMsg: RabbitMQMsg,
    channelWrapperWebhooks: ChannelWrapper
  ): Promise<void> {
    const webhook: WebhookRequestData = JSON.parse(rabbitMsg.content.toString());
    webhook.body = testData; //Just dropping this here TODO remove later


    switch(webhook.event) {
      case 'harbor:scanningcompleted' :
      case 'harbor:scanningresultfetched' :
        for(const objKey in webhook.body) {
          if(webhook.body[objKey].vulnerabilities) {
            let vulnerabilities = webhook.body[objKey].vulnerabilities;
            //Should we test these objects against some kind of type? Can we?
            vulnerabilities.forEach(element => {
              //console.log(element.description);
              try {
                addAProblem(null, 1, element.id, 'HIGH', 'harbor', null, JSON.stringify({description: element.description, links: element.links}));
                // console.log(element);
              }
             catch (error) {
                console.log(error);
             }

            });
          }
      }
      break;
    }
    channelWrapperWebhooks.ack(rabbitMsg);
};

async function addAProblem(id, environment, identifier, severity, source, severityScore, data) {
  try {
    return addProblem(id, environment, identifier, severity, source, severityScore, data);
  }
  catch (error) {
    console.log(error);
 }
}

module.exports = processProblems;