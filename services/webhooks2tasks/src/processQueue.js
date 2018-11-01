// @flow

const processProjects = require('./webhooks/projects');
const processDataSync = require('./webhooks/dataSync');
const processBackup = require('./webhooks/backup');

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
    processDataSync(rabbitMsg, channelWrapperWebhooks);
  } else if (webhooktype == 'resticbackup') {
    processBackup(rabbitMsg, channelWrapperWebhooks);
  }
  else {
    processProjects(rabbitMsg, channelWrapperWebhooks);
  }
}

module.exports = processQueue;
