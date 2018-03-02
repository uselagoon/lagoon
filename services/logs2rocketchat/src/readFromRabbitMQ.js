// @flow

const { logger } = require('@lagoon/commons/src/local-logging');

const { getRocketChatInfoForProject } = require('@lagoon/commons/src/api');

export type ChannelWrapper = {
  ack: (msg: Object) => void,
}

export type RabbitMQMsg = {
  content: Buffer,
  fields: Object,
  properties: Object,
};

export type Project = {
  rocketchat: Object,
  name: string,
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
    project,
    uuid,
    event,
    meta,
    message
  } = logMessage

  const appId = msg.properties.appId || ""

 logger.verbose(`received ${event}`, logMessage)

  switch (event) {

    case "github:pull_request:closed:handled":
    case "github:pull_request:opened:handled":
    case "github:pull_request:synchronize:handled":
    case "github:delete:handled":
    case "github:push:handled":
    case "bitbucket:repo:push:handled":
    case "gitlab:push:handled":
    case "rest:deploy:receive":
    case "rest:remove:receive":
      sendToRocketChat(project, message, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:finished":
    case "task:remove-openshift:finished":
    case "task:remove-openshift-resources:finished":
    case "task:builddeploy-openshift:complete":
      sendToRocketChat(project, message, 'good', ':white_check_mark:', channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:retry":
    case "task:remove-openshift:retry":
    case "task:remove-openshift-resources:retry":
      sendToRocketChat(project, message, 'warning', ':warning:', channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:error":
    case "task:remove-openshift:error":
    case "task:remove-openshift-resources:error":
    case "task:builddeploy-openshift:failed":
      sendToRocketChat(project, message, 'danger', ':bangbang:', channelWrapperLogs, msg, appId)
      break;

    case "github:pull_request:closed:CannotDeleteProductionEnvironment":
    case "github:push:CannotDeleteProductionEnvironment":
    case "bitbucket:repo:push:CannotDeleteProductionEnvironment":
    case "gitlab:push:CannotDeleteProductionEnvironment":
    case "rest:remove:CannotDeleteProductionEnvironment":
      sendToRocketChat(project, message, 'warning', ':warning:', channelWrapperLogs, msg, appId)
      break;

    case "unresolvedProject:webhooks2tasks":
    case "unhandledWebhook":
    case "webhooks:receive":
    case "task:deploy-openshift:start":
    case "task:remove-openshift:start":
    case "task:remove-openshift-resources:start":
    case "task:builddeploy-openshift:running":
      // known logs entries that should never go to RocketChat
      channelWrapperLogs.ack(msg)
      break;

    default:
      logger.info(`unhandled log message ${event} ${JSON.stringify(logMessage)}`)
      return channelWrapperLogs.ack(msg)
  }

}

const sendToRocketChat = async (project, message, color, emoji, channelWrapperLogs, msg, appId) => {

  let projectRocketChats;
  try {
    projectRocketChats = await getRocketChatInfoForProject(project)
  }
  catch (error) {
    logger.error(`No RocketChat information found, error: ${error}`)
    return channelWrapperLogs.ack(msg)
  }
  projectRocketChats.forEach(async (projectRocketChat) => {
    await new IncomingWebhook(projectRocketChat.webhook, {
      channel: projectRocketChat.channel,
    }).send({
      attachments: [{
        text: `${emoji} ${message}`,
        color: color,
        "mrkdwn_in": ["pretext", "text", "fields"],
        footer: appId
      }]
    });
  });
  channelWrapperLogs.ack(msg)
  return
}

module.exports = readFromRabbitMQ;
