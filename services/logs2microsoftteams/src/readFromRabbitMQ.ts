import { URL } from 'url';
import http from 'https';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { logger } from '@lagoon/commons/dist/local-logging';
import { getMicrosoftTeamsInfoForProject } from '@lagoon/commons/dist/api';
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

  const whiteCheckMark = 'https://statics.teams.microsoft.com/evergreen-assets/emojioneassets/assets-png/2705.png'
  const informationSource = 'https://statics.teams.microsoft.com/evergreen-assets/emojioneassets/assets-png/2139.png'
  const bangBang = 'https://statics.teams.microsoft.com/evergreen-assets/emojioneassets/assets-png/203c.png'
  const warning = 'https://statics.teams.microsoft.com/evergreen-assets/emojioneassets/assets-png/26a0.png'

  var text = ''

  switch (event) {

    case "github:pull_request:opened:handled":
    case "gitlab:merge_request:opened:handled":
    case "bitbucket:pullrequest:created:opened:handled":
      text = `PR [#${meta.pullrequestNumber} (${meta.pullrequestTitle})](${meta.pullrequestUrl}) opened in [${meta.repoName}](${meta.repoUrl})`
      sendToMicrosoftTeams(project, text, '#E8E8E8', informationSource, channelWrapperLogs, msg, appId)
      break;

    case "github:pull_request:synchronize:handled":
    case "bitbucket:pullrequest:updated:opened:handled":
    case "gitlab:merge_request:updated:handled":
      text = `PR [#${meta.pullrequestNumber} (${meta.pullrequestTitle})](${meta.pullrequestUrl}) updated in [${meta.repoName}](${meta.repoUrl})`
      sendToMicrosoftTeams(project, text, '#E8E8E8', informationSource, channelWrapperLogs, msg, appId)
      break;

    case "bitbucket:pullrequest:fulfilled:handled":
    case "bitbucket:pullrequest:rejected:handled":
    case "github:pull_request:closed:handled":
    case "gitlab:merge_request:closed:handled":
      text = `PR [#${meta.pullrequestNumber} (${meta.pullrequestTitle})](${meta.pullrequestUrl}) closed in [${meta.repoName}](${meta.repoUrl})`
      sendToMicrosoftTeams(project, text, '#E8E8E8', informationSource, channelWrapperLogs, msg, appId)
      break;

    case "rest:pullrequest:deploy":
      text = `REST pullrequest deploy trigger \`${meta.pullrequestTitle}\``
      sendToMicrosoftTeams(project, text, '#E8E8E8', informationSource, channelWrapperLogs, msg, appId)
      break;

    case "github:delete:handled":
    case "gitlab:remove:handled":
    case "bitbucket:delete:handled":
      text = `deleted in \`${meta.branchName}\``
      sendToMicrosoftTeams(project, text, '#E8E8E8', informationSource, channelWrapperLogs, msg, appId)
      break;

    case "rest:remove:receive":
      text = `REST remove trigger \`${meta.branchName}\``
      sendToMicrosoftTeams(project, text, '#E8E8E8', informationSource, channelWrapperLogs, msg, appId)
      break;

    case "bitbucket:repo:push:handled":
    case "github:push:handled":
    case "gitlab:push:handled":
      text = `[${meta.branchName}](${meta.repoUrl}/tree/${meta.branchName})`
      if (meta.shortSha){
        text = `${text} ([${meta.shortSha}](${meta.commitUrl}))`
      }
      text = `${text} pushed in [${meta.repoFullName}](${meta.repoUrl})`
      sendToMicrosoftTeams(project, text, '#E8E8E8', informationSource, channelWrapperLogs, msg, appId)
      break;

    case "gitlab:push:skipped":
    case "github:push:skipped":
    case "bitbucket:push:skipped":
      text = `[${meta.branchName}](${meta.repoUrl}/tree/${meta.branchName})`
      if (meta.shortSha){
        text = `${text} ([${meta.shortSha}](${meta.commitUrl}))`
      }
      text = `${text} pushed in [${meta.repoFullName}](${meta.repoUrl}) *deployment skipped*`
      sendToMicrosoftTeams(project, text, '#E8E8E8', informationSource, channelWrapperLogs, msg, appId)
      break;

    case "api:deployEnvironmentBranch":
    case "api:deployEnvironmentLatest":
      text = `API deploy trigger \`${meta.branchName}\``
      if (meta.shortSha) {
        text = `${text} (${meta.shortSha})`
      }
      sendToMicrosoftTeams(project, text, '#E8E8E8', informationSource, channelWrapperLogs, msg, appId)
      break;

    case "rest:deploy:receive":
      text = `REST deploy trigger \`${meta.branchName}\``
      if (meta.shortSha) {
        text = `${text} (${meta.shortSha})`
      }
      sendToMicrosoftTeams(project, text, '#E8E8E8', informationSource, channelWrapperLogs, msg, appId)
      break;

    case "rest:promote:receive":
      text = `REST promote trigger \`${meta.branchName}\` -> \`${meta.promoteSourceEnvironment}\``
      sendToMicrosoftTeams(project, text, 'gold', warning, channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:finished":
    case "task:remove-openshift-resources:finished":
    case "task:builddeploy-openshift:complete":
      if (meta.shortSha) {
        text = `${text} \`${meta.branchName}\` (${meta.shortSha})`
      } else {
        text = `${text} \`${meta.branchName}\``
      }
      text = `${text} Build \`${meta.buildName}\` complete.<p>`
      if (meta.logLink){
        text = `${text} [Logs](${meta.logLink})<p>`
      }
      text = `${text}<a href=${meta.route}>${meta.route}</a><p> ${meta.routes.join("<p>")}`
      sendToMicrosoftTeams(project, text, 'lawngreen', whiteCheckMark, channelWrapperLogs, msg, appId)
      break;

    case "rest:pullrequest:remove":
      text = `REST pullrequest remove trigger \`${meta.pullrequestNumber}\``
      sendToMicrosoftTeams(project, text, 'lawngreen', whiteCheckMark, channelWrapperLogs, msg, appId)
      break;

    case "task:remove-openshift:finished":
    case "task:remove-kubernetes:finished":
      text = `remove \`${meta.openshiftProject}\``
      sendToMicrosoftTeams(project, text, 'lawngreen', whiteCheckMark, channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:retry":
    case "task:remove-openshift:retry":
    case "task:remove-kubernetes:retry":
    case "task:remove-openshift-resources:retry":
      if (meta.shortSha) {
        text = `${text} \`${meta.branchName}\` (${meta.shortSha})`
      } else {
        text = `${text} \`${meta.branchName}\``
      }
      text = `${text} Build \`${meta.buildName}\` failed.`
      if (meta.logLink){
        text = `${text} ${meta.logLink}`
      }
      sendToMicrosoftTeams(project, message, 'gold', warning, channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:error":
    case "task:remove-openshift:error":
    case "task:remove-kubernetes:error":
    case "task:remove-openshift-resources:error":
    case "task:builddeploy-openshift:failed":
      if (meta.shortSha) {
        text = `${text} \`${meta.branchName}\` (${meta.shortSha})`
      } else {
        text = `${text} \`${meta.branchName}\``
      }
      text = `${text} Build \`${meta.buildName}\` failed.`
      if (meta.logLink){
        text = `${text} ${meta.logLink}`
      }
      sendToMicrosoftTeams(project, text, 'red', bangBang, channelWrapperLogs, msg, appId)
      break;

    case "github:pull_request:closed:CannotDeleteProductionEnvironment":
    case "github:push:CannotDeleteProductionEnvironment":
    case "bitbucket:repo:push:CannotDeleteProductionEnvironment":
    case "gitlab:push:CannotDeleteProductionEnvironment":
    case "rest:remove:CannotDeleteProductionEnvironment":
      text = `*[${meta.name}]* \`${meta.branchName}\` not deleted. ${meta.error}`
      sendToMicrosoftTeams(project, message, 'gold', warning, channelWrapperLogs, msg, appId)
      break;
    default:
      //since there's no single point of acknowlegement of the msg, we need to keep track of whether we've handled the message
      let eventHandledAsProblem =  dispatchProblemEventToTeams(event, project, message, channelWrapperLogs, msg, appId, bangBang);
      if(!eventHandledAsProblem) {
        return channelWrapperLogs.ack(msg);
      }
  }
}

const dispatchProblemEventToTeams = (event, project, message, channelWrapperLogs, msg, appId, errorEmoji) => {
  const problemEvent = parseProblemNotification(event);
  if(problemEvent.isProblem && problemEvent.eventType == 'insert') {
    sendToMicrosoftTeams(project, message, 'red', errorEmoji, channelWrapperLogs, msg, appId, 'PROBLEM', problemEvent.severityLevel)
      return true;
    }
  return false;
};

const sendToMicrosoftTeams = async (project, message, color, emoji, channelWrapperLogs, msg, appId, contentType = 'DEPLOYMENT', severityLevel = 'NONE') => {
  let projectMicrosoftTeamsNotifications;
  try {
    projectMicrosoftTeamsNotifications = await getMicrosoftTeamsInfoForProject(project, contentType)
  }
  catch (error) {
    logger.error(`No Microsoft Teams information found, error: ${error}`)
    return channelWrapperLogs.ack(msg)
  }

  projectMicrosoftTeamsNotifications.forEach(projectMicrosoftTeams => {
    const notificationThresholdMet = notificationContentTypeToInt(projectMicrosoftTeams.notificationSeverityThreshold) <= notificationContentTypeToInt(severityLevel);
    if(contentType == 'PROBLEM' && !notificationThresholdMet) { return; } //go to next iteration

    const { webhook } = projectMicrosoftTeams;
    const webhookUrl = new URL(webhook);

    var data = JSON.stringify(
      {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "summary": message,
        "title": project,
        "themeColor": color,
        "sections": [
            {
                "activityText": message,
                "activityImage": emoji
            }
        ]
      }
    );

    var options = {
      hostname: webhookUrl.host,
      port: webhookUrl.port,
      path: webhookUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    var req = http.request(options, function(res) {
      res.setEncoding('utf8');
    });

    req.on('error', function(e) {
      logger.error(`problem with request: ${e.message}`);
    });
    req.end(data);
  });
  channelWrapperLogs.ack(msg)
  return
}
