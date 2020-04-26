// @flow

const { logger } = require('@lagoon/commons/src/local-logging');
const testData = require('./test_data');
const uuid4 = require('uuid4');

async function harborScanningCompleted(webhook: WebhookRequestData, channelWrapperWebhooks) {
  const {
    webhooktype,
    event,
    uuid,
    body
  } = webhook;

  const webhookData = generateWebhookData(webhook.giturl, 'problems', 'harbor:scanningresultfetched', testData);
  const buffer = new Buffer(JSON.stringify(webhookData));
  await channelWrapperWebhooks.publish(`lagoon-webhooks`, '', buffer, { persistent: true });
}

const generateWebhookData = (webhookGiturl, webhooktype, event, body, id = null) => {
  return {
    webhooktype: webhooktype,
    event: event,
    giturl: webhookGiturl,
    uuid: id ? id : uuid4(),
    body: body
  }
};


module.exports = harborScanningCompleted;