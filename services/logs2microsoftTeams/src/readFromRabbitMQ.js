// @flow

const { logger } = require('@lagoon/commons/src/local-logging');

const { getMicrosoftTeamsInfoForProject } = require('@lagoon/commons/src/api');

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
  microsoftTeams: Object,
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

  logger.verbose(`received ${event} for project ${project}`)

  var text

  switch (event) {

    case "github:pull_request:opened:handled":
    case "gitlab:merge_request:opened:handled":
    case "bitbucket:pullrequest:created:opened:handled":
      text = `*[${meta.projectName}]* PR [#${meta.pullrequestNumber} (${meta.pullrequestTitle})](${meta.pullrequestUrl}) opened in [${meta.repoName}](${meta.repoUrl})`
      sendToMicrosoftTeams(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "github:pull_request:synchronize:handled":
    case "bitbucket:pullrequest:updated:opened:handled":
    case "gitlab:merge_request:updated:handled":
      text = `*[${meta.projectName}]* PR [#${meta.pullrequestNumber} (${meta.pullrequestTitle})](${meta.pullrequestUrl}) updated in [${meta.repoName}](${meta.repoUrl})`
      sendToMicrosoftTeams(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "bitbucket:pullrequest:fulfilled:handled":
    case "bitbucket:pullrequest:rejected:handled":
    case "github:pull_request:closed:handled":
    case "gitlab:merge_request:closed:handled":
      text = `*[${meta.projectName}]* PR [#${meta.pullrequestNumber} (${meta.pullrequestTitle})](${meta.pullrequestUrl}) closed in [${meta.repoName}](${meta.repoUrl})`
      sendToMicrosoftTeams(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "rest:pullrequest:deploy":
      text = `*[${meta.projectName}]* REST pullrequest deploy trigger \`${meta.pullrequestTitle}\``
      sendToMicrosoftTeams(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "github:delete:handled":
    case "gitlab:remove:handled":
    case "bitbucket:delete:handled":
      text = `*[${meta.projectName}]* deleted in \`${meta.branchName}\``
      sendToMicrosoftTeams(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "rest:remove:receive":
      text = `*[${meta.projectName}]* REST remove trigger \`${meta.branchName}\``
      sendToMicrosoftTeams(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "bitbucket:repo:push:handled":
    case "github:push:handled":
    case "gitlab:push:handled":
      text = `*[${meta.projectName}]* [${meta.branchName}](${meta.repoUrl}/tree/${meta.branchName})`
      if (meta.shortSha){
        text = `${text} ([${meta.shortSha}](${meta.commitUrl}))`
      }
      text = `${text} pushed in [${meta.repoFullName}](${meta.repoUrl})`
      sendToMicrosoftTeams(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "gitlab:push:skipped":
    case "github:push:skipped":
    case "bitbucket:push:skipped":
      text = `*[${meta.projectName}]* [${meta.branchName}](${meta.repoUrl}/tree/${meta.branchName})`
      if (meta.shortSha){
        text = `${text} ([${meta.shortSha}](${meta.commitUrl}))`
      }
      text = `${text} pushed in [${meta.repoFullName}](${meta.repoUrl}) *deployment skipped*`
      sendToMicrosoftTeams(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "api:deployEnvironmentBranch":
    case "api:deployEnvironmentLatest":
      text = `*[${meta.projectName}]* API deploy trigger \`${meta.branchName}\``
      if (meta.shortSha) {
        text = `${text} (${meta.shortSha})`
      }
      sendToMicrosoftTeams(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "rest:deploy:receive":
      text = `*[${meta.projectName}]* REST deploy trigger \`${meta.branchName}\``
      if (meta.shortSha) {
        text = `${text} (${meta.shortSha})`
      }
      sendToMicrosoftTeams(project, text, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "rest:promote:receive":
      text = `*[${meta.projectName}]* REST promote trigger \`${meta.branchName}\` -> \`${meta.promoteSourceEnvironment}\``
      sendToMicrosoftTeams(project, text, 'gold', ':warning:', channelWrapperLogs, msg, appId)
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
      text = `${text} Build \`${meta.buildName}\` complete.`
      if (meta.logLink){
        text = `${text} [Logs](${meta.logLink})\n`
      }
      text = `\n${text}${meta.route}\n ${meta.routes.join("\n")}`
      sendToMicrosoftTeams(project, text, 'lawngreen', ':white_check_mark:', channelWrapperLogs, msg, appId)
      break;

    case "rest:pullrequest:remove":
      text = `*[${meta.projectName}]* REST pullrequest remove trigger \`${meta.pullrequestNumber}\``
      sendToMicrosoftTeams(project, text, 'lawngreen', ':white_check_mark:', channelWrapperLogs, msg, appId)
      break;

    case "task:remove-openshift:finished":
      text = `*[${meta.projectName}]* remove \`${meta.openshiftProject}\``
      sendToMicrosoftTeams(project, text, 'lawngreen', ':white_check_mark:', channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:retry":
    case "task:remove-openshift:retry":
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
      sendToMicrosoftTeams(project, message, 'gold', ':warning:', channelWrapperLogs, msg, appId)
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
      text = `${text} Build \`${meta.buildName}\` failed.`
      if (meta.logLink){
        text = `${text} ${meta.logLink}`
      }
      sendToMicrosoftTeams(project, text, 'red', ':bangbang:', channelWrapperLogs, msg, appId)
      break;

    case "github:pull_request:closed:CannotDeleteProductionEnvironment":
    case "github:push:CannotDeleteProductionEnvironment":
    case "bitbucket:repo:push:CannotDeleteProductionEnvironment":
    case "gitlab:push:CannotDeleteProductionEnvironment":
    case "rest:remove:CannotDeleteProductionEnvironment":
      text = `*[${meta.name}]* \`${meta.branchName}\` not deleted. ${meta.error}`
      sendToMicrosoftTeams(project, message, 'gold', ':warning:', channelWrapperLogs, msg, appId)
      break;

    default:
      return channelWrapperLogs.ack(msg)
  }

}

const sendToMicrosoftTeams = async (project, message, color, emoji, channelWrapperLogs, msg, appId) => {
  let projectMicrosoftTeamses;
  try {
    projectMicrosoftTeamses = await getMicrosoftTeamsInfoForProject(project)
  }
  catch (error) {
    logger.error(`No Microsoft Teams information found, error: ${error}`)
    return channelWrapperLogs.ack(msg)
  }
  projectMicrosoftTeamses.forEach(async (projectMicrosoftTeams) => {
    const { webhook } = projectMicrosoftTeams;
    const webhookUrl = new URL(webhook);

    var data = JSON.stringify({
      "text": `${message}`
    });

    var options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    var req = http.request(webhook, options, function(res) {
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
