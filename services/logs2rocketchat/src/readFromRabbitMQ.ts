import { URL } from 'url';
import http from 'https';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { logger } from '@lagoon/commons/dist/local-logging';
import { getRocketChatInfoForProject } from '@lagoon/commons/dist/api';
import { notificationIntToContentType, notificationContentTypeToInt, parseProblemNotification } from '@lagoon/commons/dist/notificationCommons';

export async function readFromRabbitMQ (msg: ConsumeMessage, channelWrapperLogs: ChannelWrapper): Promise<void> {
  const logMessage = JSON.parse(msg.content.toString())

  const {
    severity,
    project,
    uuid,
    event,
    meta,
    message
  } = logMessage

  const appId = msg.properties.appId || ""

  logger.verbose(`received ${event} for project ${project}`)

  var text

  switch (event) {

    case "github:pull_request:opened:handled":
    case "gitlab:merge_request:opened:handled":
    case "bitbucket:pullrequest:created:opened:handled":
      text = `*[${meta.projectName}]* PR [#${meta.pullrequestNumber} (${meta.pullrequestTitle})](${meta.pullrequestUrl}) opened in [${meta.repoName}](${meta.repoUrl})`
      sendToRocketChat(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "github:pull_request:synchronize:handled":
    case "bitbucket:pullrequest:updated:opened:handled":
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
    case "api:deleteEnvironment":
      text = `*[${meta.projectName}]* delete trigger \`${meta.environmentName}\``
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

    case "api:deployEnvironmentLatest":
    case "api:deployEnvironmentBranch":
        text = `*[${meta.projectName}]* API deploy trigger \`${meta.branchName}\``
        if (meta.shortSha) {
          text = `${text} (${meta.shortSha})`
        }
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
    case "task:builddeploy-kubernetes:complete":
      text = `*[${meta.projectName}]* `
      if (meta.shortSha) {
        text = `${text} \`${meta.branchName}\` (${meta.shortSha})`
      } else {
        text = `${text} \`${meta.branchName}\``
      }
      text = `${text} Build \`${meta.buildName}\` complete.`
      if (meta.logLink){
        text = `${text} [Logs](${meta.logLink})\n`
      }
      text = `${text}\n ${meta.route}\n`
      if (meta.routes) {
       text = `${text}\n ${meta.routes.join("\n")}`
      }
      sendToRocketChat(project, text, 'lawngreen', ':white_check_mark:', channelWrapperLogs, msg, appId)
      break;

    case "rest:pullrequest:remove":
      text = `*[${meta.projectName}]* REST pullrequest remove trigger \`${meta.pullrequestNumber}\``
      sendToRocketChat(project, text, 'lawngreen', ':white_check_mark:', channelWrapperLogs, msg, appId)
      break;

    case "task:remove-openshift:finished":
    case "task:remove-kubernetes:finished":
      text = `*[${meta.projectName}]* remove \`${meta.openshiftProject}\``
      sendToRocketChat(project, text, 'lawngreen', ':white_check_mark:', channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:retry":
    case "task:remove-openshift:retry":
    case "task:remove-kubernetes:retry":
    case "task:remove-openshift-resources:retry":
      text = `*[${meta.projectName}]*`
      if (meta.shortSha) {
        text = `${text} \`${meta.branchName}\` (${meta.shortSha})`
      } else {
        text = `${text} \`${meta.branchName}\``
      }
      text = `${text} Build \`${meta.buildName}\` failed.`
      if (meta.logLink){
        text = `${text} ${meta.logLink}`
      }
      sendToRocketChat(project, message, 'gold', ':warning:', channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:error":
    case "task:remove-openshift:error":
    case "task:remove-kubernetes:error":
    case "task:remove-openshift-resources:error":
    case "task:builddeploy-kubernetes:failed":
    case "task:builddeploy-openshift:failed":
      text = `*[${meta.projectName}]*`
      if (meta.shortSha) {
        text = `${text} \`${meta.branchName}\` (${meta.shortSha})`
      } else {
        text = `${text} \`${meta.branchName}\``
      }
      text = `${text} Build \`${meta.buildName}\` failed.`
      if (meta.logLink){
        text = `${text} [Logs](${meta.logLink})\n`
      }
      sendToRocketChat(project, text, 'red', ':bangbang:', channelWrapperLogs, msg, appId)
      break;

    case "github:pull_request:closed:CannotDeleteProductionEnvironment":
    case "github:push:CannotDeleteProductionEnvironment":
    case "bitbucket:repo:push:CannotDeleteProductionEnvironment":
    case "gitlab:push:CannotDeleteProductionEnvironment":
    case "rest:remove:CannotDeleteProductionEnvironment":
      text = `*[${meta.name}]* \`${meta.branchName}\` not deleted. ${meta.error}`
      sendToRocketChat(project, message, 'gold', ':warning:', channelWrapperLogs, msg, appId)
      break;

    default:
      //since there's no single point of acknowlegement of the msg, we need to keep track of whether we've handled the message
      let eventHandledAsProblem =  dispatchProblemEventToRocketChat(event, project, message, channelWrapperLogs, msg, appId);
      if(!eventHandledAsProblem) {
        return channelWrapperLogs.ack(msg);
      }
  }

}

const dispatchProblemEventToRocketChat = (event, project, message, channelWrapperLogs, msg, appId) => {
  const problemEvent = parseProblemNotification(event);
  if(problemEvent.isProblem && problemEvent.eventType == 'insert') {
      sendToRocketChat(project, message, 'red', ':warning:', channelWrapperLogs, msg, appId, 'PROBLEM', problemEvent.severityLevel)
      return true;
    }
  return false;
};

const sendToRocketChat = async (project, message, color, emoji, channelWrapperLogs, msg, appId, contentType = 'DEPLOYMENT', severityLevel = 'NONE') => {
  let projectRocketChats;
  try {
    projectRocketChats = await getRocketChatInfoForProject(project, contentType)
  }
  catch (error) {
    logger.error(`No RocketChat information found, error: ${error}`)
    return channelWrapperLogs.ack(msg)
  }
  projectRocketChats.forEach(async (projectRocketChat) => {

    const notificationThresholdMet = notificationContentTypeToInt(projectRocketChat.notificationSeverityThreshold) <= notificationContentTypeToInt(severityLevel);
    if(contentType == 'PROBLEM' && !notificationThresholdMet) { return; } //go to next iteration

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
