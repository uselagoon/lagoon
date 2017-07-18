// @flow

import { logger } from '@amazeeio/amazeeio-local-logging';

import { sendToAmazeeioLogs } from '@amazeeio/amazeeio-logs';

import { createRemoveTask } from '@amazeeio/amazeeio-tasks';

import type { WebhookRequestData, removeOpenshiftResourcesData, ChannelWrapper, SiteGroup } from '../types';

export default async function githubPullRequestClosed(webhook: WebhookRequestData, siteGroup: SiteGroup, channelWrapper: ChannelWrapper) {

    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
    } = webhook;

    const openshiftNamingPullRequests = (typeof siteGroup.openshift.naming !== 'undefined') ? siteGroup.openshift.naming.pullrequest : "${sitegroup}-pr-${number}"
    const openshiftRessourceAppName = openshiftNamingPullRequests.replace('${number}', body.number).replace('${sitegroup}', siteGroup.siteGroupName)

    const meta = {
      prNumber: body.number
    }

    const data: removeOpenshiftResourcesData = {
      siteGroupName: siteGroup.siteGroupName,
      openshiftRessourceAppName: openshiftRessourceAppName
    }

    sendToAmazeeioLogs('info', siteGroup.siteGroupName, uuid, `${webhooktype}:${event}:closed:receive`, meta,
      `PR <${body.pull_request.html_url}|#${body.number} (${body.pull_request.title})> closed in <${body.repository.html_url}|${body.repository.full_name}>`
    )

    try {
      const taskResult = await createRemoveTask(data);
      logger.verbose(taskResult)
      return;
    } catch (error) {
      switch (error.name) {
        case "SiteGroupNotFound":
        case "NoActiveSystemsDefined":
        case "UnknownActiveSystem":
          // These are not real errors and also they will happen many times. We just log them locally but will ack the message
          logger.verbose(error)
          return;

        default:
          // Other messages are real errors and should reschedule the message in RabbitMQ in order to try again
          throw error
      }
    }
}