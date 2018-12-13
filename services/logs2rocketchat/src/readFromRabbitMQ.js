// @flow

const { logger } = require('@lagoon/commons/src/local-logging');

const { getRocketChatInfoForProject } = require('@lagoon/commons/src/api');

const { URL } = require('url');
const http = require('https');

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

  var text

  switch (event) {

    case "github:pull_request:opened:handled":
    case "gitlab:merge_request:opened:handled":
    case "bitbucket:pullrequest:created:handled":
      text = `*[${meta.projectName}]* PR [#${meta.pullrequestNumber} (${meta.pullrequestTitle})](${meta.pullrequestUrl}) opened in [${meta.repoName}](${meta.repoUrl})`
      sendToRocketChat(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "github:pull_request:synchronize:handled":
    case "bitbucket:pullrequest:updated:handled":
    case "gitlab:merge_request:updated:handled":
      text = `*[${meta.projectName}]* PR [#${meta.pullrequestNumber} (${meta.pullrequestTitle})](${meta.pullrequestUrl}) updated in [${meta.repoName}](${meta.repoUrl})`
      sendToRocketChat(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "bitbucket:pullrequest:fulfilled:handled":
    case "bitbucket:pullrequest:rejected:handled":
    case "github:pull_request:closed:handled":
    case "gitlab:merge_request:closed:handled":
      text = `*[${meta.projectName}]* PR [#${meta.pullrequestNumber} (${meta.pullrequestTitle})](${meta.pullrequestUrl}) closed in [${meta.repoName}](${meta.repoUrl})`
      sendToRocketChat(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "rest:pullrequest:deploy":
      text = `*[${meta.projectName}]* REST pullrequest deploy trigger \`${meta.pullrequestTitle}\``
      sendToRocketChat(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "github:delete:handled":
    case "gitlab:remove:handled":
    case "bitbucket:delete:handled":
      text = `*[${meta.projectName}]* deleted in \`${meta.branchName}\``
      sendToRocketChat(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "rest:remove:receive":
      text = `*[${meta.projectName}]* REST remove trigger \`${meta.branchName}\``
      sendToRocketChat(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "bitbucket:repo:push:handled":
    case "github:push:handled":
    case "gitlab:push:handled":
      text = `*[${meta.projectName}]* [${meta.branchName}](${meta.repoUrl}/tree/${meta.branchName})`
      if (meta.shortSha){
        text = `${text} ([${meta.shortSha}](${meta.commitUrl}))`
      }
      text = `${text} pushed in [${meta.repoFullName}](${meta.repoUrl})`
      sendToRocketChat(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "gitlab:push:skipped":
    case "github:push:skipped":
    case "bitbucket:push:skipped":
      text = `*[${meta.projectName}]* [${meta.branchName}](${meta.repoUrl}/tree/${meta.branchName})`
      if (meta.shortSha){
        text = `${text} ([${meta.shortSha}](${meta.commitUrl}))`
      }
      text = `${text} pushed in [${meta.repoFullName}](${meta.repoUrl}) *deployment skipped*`
      sendToRocketChat(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "rest:deploy:receive":
      text = `*[${meta.projectName}]* REST deploy trigger \`${meta.branchName}\``
      if (meta.shortSha) {
        text = `${text} (${meta.shortSha})`
      }
      sendToRocketChat(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "rest:promote:receive":
      text = `*[${meta.projectName}]* REST promote trigger \`${meta.branchName}\` -> \`${meta.promoteSourceEnvironment}\``
      sendToRocketChat(project, text, 'gold', ':warning:', channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:finished":
    case "task:remove-openshift-resources:finished":
    case "task:builddeploy-openshift:complete":
      text = `*[${meta.projectName}]* `
      if (meta.shortSha) {
        text = `${text} \`${meta.branchName}\` (${meta.shortSha})`
      } else {
        text = `${text} \`${meta.branchName}\``
      }
      text = `${text} Build \`${meta.buildName}\` complete. ${meta.logLink} \n ${meta.route}\n ${meta.routes.join("\n")}`
      sendToRocketChat(project, text, 'lawngreen', ':white_check_mark:', channelWrapperLogs, msg, appId)
      break;

    case "rest:pullrequest:remove":
      text = `*[${meta.projectName}]* REST pullrequest remove trigger \`${meta.pullrequestNumber}\``
      sendToRocketChat(project, text, 'lawngreen', ':white_check_mark:', channelWrapperLogs, msg, appId)
      break;

    case "task:remove-openshift:finished":
      text = `*[${meta.projectName}]* remove \`${meta.openshiftProject}\``
      sendToRocketChat(project, text, 'lawngreen', ':white_check_mark:', channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:retry":
    case "task:remove-openshift:retry":
    case "task:remove-openshift-resources:retry":
      sendToRocketChat(project, message, 'gold', ':warning:', channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:error":
    case "task:remove-openshift:error":
    case "task:remove-openshift-resources:error":
    case "task:builddeploy-openshift:failed":
      text = `*[${meta.projectName}]*`
      if (meta.shortSha) {
        text = `${text} \`${meta.branchName}\` (${meta.shortSha})`
      } else {
        text = `${text} \`${meta.branchName}\``
      }
      text = `${text} Build \`${meta.buildName}\` failed. ${meta.logLink}`
      sendToRocketChat(project, text, 'red', ':bangbang:', channelWrapperLogs, msg, appId)
      break;

    case "github:pull_request:closed:CannotDeleteProductionEnvironment":
    case "github:push:CannotDeleteProductionEnvironment":
    case "bitbucket:repo:push:CannotDeleteProductionEnvironment":
    case "gitlab:push:CannotDeleteProductionEnvironment":
    case "rest:remove:CannotDeleteProductionEnvironment":
      sendToRocketChat(project, message, 'gold', ':warning:', channelWrapperLogs, msg, appId)
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
    const { channel, webhook } = projectRocketChat;
    const rocketchat = new URL(webhook);

    var data = JSON.stringify({
      channel: `#${channel}`,
      attachments: [{
        text: `${emoji} ${message}`,
        color: color,
        fields: [
          {
            "short": true,
            "title": "Source",
            "value": appId
          }
        ],
      }]
    });

    var options = {
      hostname: rocketchat.hostname,
      port: rocketchat.port,
      path: rocketchat.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    var req = http.request(options, function(res) {
      res.setEncoding('utf8');
    });

    req.on('error', function(e) {
      logger.error(`problem with request: ${e.message}`);
    });
    req.write(data);
    req.end();
  });
  channelWrapperLogs.ack(msg)
  return
}

module.exports = readFromRabbitMQ;
