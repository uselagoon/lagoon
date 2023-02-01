import R from 'ramda';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { secureGitlabSystemHooks } from '@lagoon/commons/dist/gitlab/api';
import { processProjects } from './webhooks/projects';
import { processDataSync } from './webhooks/dataSync';
import { processBackup } from './webhooks/backup';
import { processProblems } from './webhooks/problems';
import { WebhookRequestData } from './types';

export async function processQueue (rabbitMsg: ConsumeMessage, channelWrapperWebhooks: ChannelWrapper): Promise<void> {
  const webhook: WebhookRequestData = JSON.parse(rabbitMsg.content.toString())

  const {
    webhooktype,
    event,
    giturl,
  } = webhook;

  // GitLab supports System Hooks which trigger on changes like creating new
  // organizations or users. Since these don't have associated projects, they
  // must be handled separately.
  if (webhooktype == 'gitlab' && R.contains(event, secureGitlabSystemHooks)) {
    processDataSync(rabbitMsg, channelWrapperWebhooks);
  } else if (webhooktype == 'resticbackup') {
    processBackup(rabbitMsg, channelWrapperWebhooks);
  } else if (webhooktype == 'problems') {
    processProblems(rabbitMsg, channelWrapperWebhooks);
  }
  else {
    processProjects(rabbitMsg, channelWrapperWebhooks);
  }
}
