// @flow

const { logger } = require('@amazeeio/lagoon-commons/src/local-logging');

const { getSlackinfoForSiteGroup } = require('@amazeeio/lagoon-commons/src/api');

var IncomingWebhook = require('@slack/client').IncomingWebhook;

export type ChannelWrapper = {
  ack: (msg: Object) => void,
}

export type RabbitMQMsg = {
  content: Buffer,
  fields: Object,
  properties: Object,
};

export type SiteGroup = {
  slack: Object,
  siteGroupName: string,
};

async function readFromRabbitMQ (msg: RabbitMQMsg, channelWrapperLogs: ChannelWrapper): Promise<void> {
  const {
    content,
    fields,
    properties,
  } = msg;

  const logMessage = JSON.parse(content.toString())

  const {
    severity,
    sitegroup,
    uuid,
    event,
    meta,
    message
  } = logMessage

  const appId = msg.properties.appId || ""

 logger.verbose(`received ${event}`, logMessage)

  switch (event) {

    case "github:pull_request:closed:handled":
    case "github:delete:handled":
    case "github:push:handled":
    case "bitbucket:repo:push:handled":
    case "gitlab:push:handled":
    case "rest:deploy:receive":
    case "rest:remove:receive":
      sendToSlack(sitegroup, message, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:finished":
    case "task:remove-openshift:finished":
    case "task:remove-openshift-resources:finished":
      sendToSlack(sitegroup, message, 'good', ':white_check_mark:', channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:retry":
    case "task:remove-openshift:retry":
    case "task:remove-openshift-resources:retry":
      sendToSlack(sitegroup, message, 'warning', ':warning:', channelWrapperLogs, msg, appId)
      break;

      case "task:deploy-openshift:error":
      case "task:remove-openshift:error":
      case "task:remove-openshift-resources:error":
      sendToSlack(sitegroup, message, 'danger', ':bangbang:', channelWrapperLogs, msg, appId)
      break;

    case "unresolvedSitegroup:webhooks2tasks":
    case "unhandledWebhook":
    case "webhooks:receive":
    case "task:deploy-openshift:start":
    case "task:remove-openshift:start":
    case "task:remove-openshift-resources:start":
      // known logs entries that should never go to slack
      channelWrapperLogs.ack(msg)
      break;

    default:
      logger.warn(`unhandled log message ${event} ${JSON.stringify(logMessage)}`)
      return channelWrapperLogs.ack(msg)
  }

}

const sendToSlack = async (sitegroup, message, color, emoji, channelWrapperLogs, msg, appId) => {

  let sitegroupSlack;
  try {
    sitegroupSlack = await getSlackinfoForSiteGroup(sitegroup)
  }
  catch (error) {
    logger.error(`No Slack information found, error: ${error}`)
    return channelWrapperLogs.ack(msg)
  }

  await new IncomingWebhook(sitegroupSlack.slack.webhook, {
    channel: sitegroupSlack.slack.channel,
  }).send({
    attachments: [{
      text: `${emoji} ${message}`,
      color: color,
      "mrkdwn_in": ["pretext", "text", "fields"],
      footer: appId
    }]
  });
  channelWrapperLogs.ack(msg)
  return
}

module.exports = readFromRabbitMQ;
