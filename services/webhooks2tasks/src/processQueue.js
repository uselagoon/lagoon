// @flow

const processProjects = require('./webhooks/projects');
const processOther = require('./webhooks/other');

import type { WebhookRequestData, ChannelWrapper, RabbitMQMsg } from './types';

function processQueue (rabbitMsg: RabbitMQMsg, channelWrapperWebhooks: ChannelWrapper): Promise<void> {
  const webhook: WebhookRequestData = JSON.parse(rabbitMsg.content.toString())

  const {
    webhooktype,
    giturl,
  } = webhook;

  // GitLab supports System Hooks which trigger on changes like creating new
  // organizations or users. Since these don't have associated projects, they
  // must be handled separately.
  if (webhooktype == 'gitlab' && !giturl) {
    processOther(rabbitMsg, channelWrapperWebhooks);
  }
  else {
    processProjects(rabbitMsg, channelWrapperWebhooks);
  }
}

module.exports = processQueue;
