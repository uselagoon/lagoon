// @flow

import { logger } from '@amazeeio/amazeeio-local-logging';

import { sendToAmazeeioLogs } from '@amazeeio/amazeeio-logs';

import { createRemoveTask } from '@amazeeio/amazeeio-tasks';

import type { WebhookRequestData, removeOpenshiftResourcesData, ChannelWrapper, SiteGroup  } from '../types';

export default async function githubBranchDeleted(webhook: WebhookRequestData, siteGroup: SiteGroup, channelWrapper: ChannelWrapper) {

    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
    } = webhook;

    const saveBranchname = body.ref.toLowerCase().replace('refs/heads/','').replace('/','-')

    const openshiftNamingPullRequests = (typeof siteGroup.openshift.naming !== 'undefined') ? siteGroup.openshift.naming.branch : "${sitegroup}-${branch}"
    const openshiftRessourceAppName = openshiftNamingPullRequests.replace('${branch}', saveBranchname).replace('${sitegroup}', siteGroup.siteGroupName).replace('_','-')

    const meta = {
      branch: saveBranchname,
      origBranch: body.ref.replace('refs/heads/','')
    }

    const data: removeOpenshiftResourcesData = {
      siteGroupName: siteGroup.siteGroupName,
      openshiftRessourceAppName: openshiftRessourceAppName,
    }

    sendToAmazeeioLogs('info', siteGroup.siteGroupName, uuid, `${webhooktype}:${event}:receive`, meta,
      `Branch \`${meta.origBranch}\` deleted in <${body.repository.html_url}|${body.repository.full_name}>`
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