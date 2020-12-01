import nodemailer from 'nodemailer';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { logger } from '@lagoon/commons/dist/local-logging';
import { getEmailInfoForProject } from '@lagoon/commons/dist/api';
import { notificationIntToContentType, notificationContentTypeToInt, parseProblemNotification } from '@lagoon/commons/dist/notificationCommons';

let transporter = nodemailer.createTransport({
  sendmail: true,
  newline: 'unix',
  path: '/usr/sbin/ssmtp'
});

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

  var messageMeta = {
    subject: '',
    mainHtml: '',
    plainText: '',
    additional: '',
    color: '#E8E8E8',
    emoji: '❔'
  }

  switch (event) {

    case "github:pull_request:opened:handled":
    case "gitlab:merge_request:opened:handled":
    case "bitbucket:pullrequest:created:opened:handled":
      messageMeta.color = '#E8E8E8'
      messageMeta.emoji = '️ℹ️'
      messageMeta.mainHtml = `PR <a href="${meta.pullrequestUrl}">#${meta.pullrequestNumber} (${meta.pullrequestTitle}</a> opened in <a href="${meta.repoUrl}">${meta.repoName}</a>`
      messageMeta.plainText = `[${meta.projectName}] PR #${meta.pullrequestNumber} - ${meta.pullrequestTitle} opened in ${meta.repoName}`
      messageMeta.subject = messageMeta.plainText
      sendToEmail(project, messageMeta, channelWrapperLogs, msg, appId)
      break;

    case "github:pull_request:synchronize:handled":
    case "bitbucket:pullrequest:updated:opened:handled":
    case "gitlab:merge_request:updated:handled":
      messageMeta.color = '#E8E8E8'
      messageMeta.emoji = '️ℹ️'
      messageMeta.mainHtml = `PR <a href="${meta.pullrequestUrl}">#${meta.pullrequestNumber} (${meta.pullrequestTitle})</a> updated in <a href="${meta.repoUrl}">${meta.repoName}</a>`
      messageMeta.plainText = `[${meta.projectName}] PR [#${meta.pullrequestNumber} (${meta.pullrequestTitle})](${meta.pullrequestUrl}) updated in ${meta.repoName}`
      sendToEmail(project, messageMeta, channelWrapperLogs, msg, appId)
      break;

    case "bitbucket:pullrequest:fulfilled:handled":
    case "bitbucket:pullrequest:rejected:handled":
    case "github:pull_request:closed:handled":
    case "gitlab:merge_request:closed:handled":
      messageMeta.color = '#E8E8E8'
      messageMeta.emoji = '️ℹ️'
      messageMeta.mainHtml = `[${meta.projectName}] PR <a href="${meta.pullrequestUrl}">#${meta.pullrequestNumber} (${meta.pullrequestTitle})</a> closed in <a href="${meta.repoUrl}">${meta.repoName}</a>`
      messageMeta.plainText = `[${meta.projectName}] PR [#${meta.pullrequestNumber} (${meta.pullrequestTitle})](${meta.pullrequestUrl}) closed in ${meta.repoName}`
      messageMeta.subject = messageMeta.plainText
      sendToEmail(project, messageMeta, channelWrapperLogs, msg, appId)
      break;

    case "rest:pullrequest:deploy":
      messageMeta.color = '#E8E8E8'
      messageMeta.emoji = '️ℹ️'
      messageMeta.mainHtml = `REST pullrequest deploy trigger <code>${meta.pullrequestTitle}</code>`
      messageMeta.plainText = `[${meta.projectName}] REST pullrequest deploy trigger for PR : ${meta.pullrequestTitle}`
      messageMeta.subject = messageMeta.plainText
      sendToEmail(project, messageMeta, channelWrapperLogs, msg, appId)
      break;

    case "github:delete:handled":
    case "gitlab:remove:handled":
    case "bitbucket:delete:handled":
      messageMeta.color = '#E8E8E8'
      messageMeta.emoji = '️ℹ️'
      messageMeta.mainHtml = `Deleted environment <code>${meta.branchName}</code>`
      messageMeta.plainText = `[${meta.projectName}] deleted environment ${meta.branchName}`
      messageMeta.subject = messageMeta.plainText
      sendToEmail(project, messageMeta, channelWrapperLogs, msg, appId)
      break;

    case "rest:remove:receive":
      messageMeta.color = '#E8E8E8'
      messageMeta.emoji = '️ℹ️'
      messageMeta.mainHtml = `REST remove trigger <code>${meta.branchName}</code>`
      messageMeta.plainText = `[${meta.projectName}] REST remove trigger ${meta.branchName}`
      messageMeta.subject = messageMeta.plainText
      sendToEmail(project, messageMeta, channelWrapperLogs, msg, appId)
      break;

    case "bitbucket:repo:push:handled":
    case "github:push:handled":
    case "gitlab:push:handled":
      messageMeta.color = '#E8E8E8'
      messageMeta.emoji = '️ℹ️'
      messageMeta.mainHtml = `<a href="${meta.repoUrl}/tree/${meta.branchName}">${meta.branchName}</a>`
      messageMeta.plainText = `[${meta.projectName}] ${meta.branchName}`
      if (meta.shortSha){
        messageMeta.mainHtml = `${messageMeta.plainText} <a href="${meta.commitUrl}">${meta.shortSha}</a>`
        messageMeta.plainText = `${messageMeta.plainText} (${meta.shortSha})`
      }
      messageMeta.mainHtml = `${messageMeta.mainHtml} pushed in <a href="${meta.repoUrl}">${meta.repoFullName}</a>`
      messageMeta.plainText = `${messageMeta.plainText} pushed in ${meta.repoFullName}`
      messageMeta.subject = messageMeta.plainText
      sendToEmail(project, messageMeta, channelWrapperLogs, msg, appId)
      break;

    case "gitlab:push:skipped":
    case "github:push:skipped":
    case "bitbucket:push:skipped":
      messageMeta.color = '#E8E8E8'
      messageMeta.emoji = '️ℹ️'
      messageMeta.mainHtml = `<a href="${meta.repoUrl}/tree/${meta.branchName}">${meta.branchName}</a>`
      messageMeta.plainText = `[${meta.projectName}] ${meta.branchName}`
      if (meta.shortSha){
        messageMeta.mainHtml = `${messageMeta.plainText} <a href="${meta.commitUrl}">${meta.shortSha}</a>`
        messageMeta.plainText = `${messageMeta.plainText} (${meta.shortSha})`
      }
      messageMeta.mainHtml = `${messageMeta.plainText} pushed in <a href="${meta.repoUrl}">${meta.repoFullName}</a> <strong>deployment skipped</strong>`
      messageMeta.plainText = `${messageMeta.plainText} pushed in ${meta.repoFullName} *deployment skipped*`
      messageMeta.subject = messageMeta.plainText
      sendToEmail(project, messageMeta, channelWrapperLogs, msg, appId)
      break;

    case "api:deployEnvironmentBranch":
    case "api:deployEnvironmentLatest":
      messageMeta.color = '#E8E8E8'
      messageMeta.emoji = '️ℹ️'
      messageMeta.mainHtml = `API deploy trigger <code>${meta.branchName}</code>`
      messageMeta.plainText = `[${meta.projectName}] API deploy trigger on branch: ${meta.branchName}`
      if (meta.shortSha) {
        messageMeta.mainHtml = `${messageMeta.mainHtml} (${meta.shortSha})`
        messageMeta.plainText = `${messageMeta.plainText} (${meta.shortSha})`
      }
      messageMeta.subject = messageMeta.plainText
      sendToEmail(project, messageMeta, channelWrapperLogs, msg, appId)
      break;

    case "rest:deploy:receive":
      messageMeta.color = '#E8E8E8'
      messageMeta.emoji = '️ℹ️'
      messageMeta.mainHtml = `REST deploy trigger on branch <code>${meta.branchName}</code>`
      messageMeta.plainText = `[${meta.projectName}] REST deploy trigger on branch: ${meta.branchName}`
      if (meta.shortSha) {
        messageMeta.mainHtml = `${messageMeta.mainHtml} (${meta.shortSha})`
        messageMeta.plainText = `${messageMeta.plainText} (${meta.shortSha})`
      }
      messageMeta.subject = messageMeta.plainText
      sendToEmail(project, messageMeta, channelWrapperLogs, msg, appId)
      break;

    case "rest:promote:receive":
      messageMeta.color = '#E8E8E8'
      messageMeta.emoji = '⚠️'
      messageMeta.mainHtml = `REST promote trigger : Branch <code>${meta.branchName}</code> -> <code>${meta.promoteSourceEnvironment}</code>`
      messageMeta.plainText = `[${meta.projectName}] REST promote trigger : ${meta.branchName} -> ${meta.promoteSourceEnvironment}`
      messageMeta.subject = messageMeta.plainText
      sendToEmail(project, messageMeta, channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:finished":
    case "task:remove-openshift-resources:finished":
    case "task:builddeploy-openshift:complete":
      messageMeta.color = 'lawngreen'
      messageMeta.emoji = '✅'
      messageMeta.plainText = `[${meta.projectName}] `
      if (meta.shortSha) {
        messageMeta.mainHtml = `${messageMeta.plainText} <code>${meta.branchName}</code> (${meta.shortSha})`
        messageMeta.plainText = `${messageMeta.plainText} ${meta.branchName} (${meta.shortSha})`
      } else {
        messageMeta.mainHtml = `${messageMeta.plainText} <code>${meta.branchName}</code>`
        messageMeta.plainText = `${messageMeta.plainText} ${meta.branchName}`
      }
      messageMeta.mainHtml = `${messageMeta.plainText} Build <code>${meta.buildName}</code> complete.`
      messageMeta.plainText = `${messageMeta.plainText} Build ${meta.buildName} complete.`
      messageMeta.subject = messageMeta.plainText
      if (meta.logLink){
        messageMeta.mainHtml = `${messageMeta.plainText} <a href="${meta.logLink}">Logs</a>`
        messageMeta.plainText = `${messageMeta.plainText} [Logs](${meta.logLink})\n`
      }
      messageMeta.plainText = `\n${messageMeta.plainText}${meta.route}\n ${meta.routes.join("\n")}`
      messageMeta.additional = `<ul><li><a href="${meta.route}">${meta.route}</a></li>${meta.routes.map(function(route){return '<li><a href="' + route + '">' + route + '</a></li>'}).join('\n')}</ul>`
      sendToEmail(project, messageMeta, channelWrapperLogs, msg, appId)
      break;

    case "rest:pullrequest:remove":
      messageMeta.color = 'lawngreen'
      messageMeta.emoji = '✅'
      messageMeta.mainHtml = `REST pullrequest remove trigger ${meta.pullrequestNumber}`
      messageMeta.plainText = `[${meta.projectName}] REST pullrequest remove trigger ${meta.pullrequestNumber}`
      messageMeta.subject = messageMeta.plainText
      sendToEmail(project, messageMeta, channelWrapperLogs, msg, appId)
      break;

    case "task:remove-openshift:finished":
    case "task:remove-kubernetes:finished":
      messageMeta.color = 'lawngreen'
      messageMeta.emoji = '✅'
      messageMeta.mainHtml = `Remove <code>${meta.openshiftProject}</code>`
      messageMeta.plainText = `[${meta.projectName}] remove ${meta.openshiftProject}`
      messageMeta.subject = messageMeta.plainText
      sendToEmail(project, messageMeta, channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:retry":
    case "task:remove-openshift:retry":
    case "task:remove-kubernetes:retry":
    case "task:remove-openshift-resources:retry":
      messageMeta.color = 'gold'
      messageMeta.emoji = '⚠️'
      messageMeta.plainText = `[${meta.projectName}]`
      if (meta.shortSha) {
        messageMeta.mainHtml = `<code>${meta.branchName}</code> (${meta.shortSha})`
        messageMeta.plainText = `${messageMeta.plainText} ${meta.branchName} (${meta.shortSha})`
      } else {
        messageMeta.mainHtml = `${messageMeta.mainHtml} <code>${meta.branchName}</code>`
        messageMeta.plainText = `${messageMeta.plainText} ${meta.branchName}`
      }
      messageMeta.mainHtml = `${messageMeta.mainHtml} Build <code>${meta.buildName}</code> retried.`
      messageMeta.plainText = `${messageMeta.plainText} Build ${meta.buildName} retried.`
      messageMeta.subject = messageMeta.plainText
      if (meta.logLink){
        messageMeta.mainHtml = `${messageMeta.mainHtml} ${meta.logLink}`
        messageMeta.plainText = `${messageMeta.plainText} ${meta.logLink}`
      }
      sendToEmail(project, messageMeta, channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:error":
    case "task:remove-openshift:error":
    case "task:remove-kubernetes:error":
    case "task:remove-openshift-resources:error":
    case "task:builddeploy-openshift:failed":
      messageMeta.color = 'red'
      messageMeta.emoji = '‼️'
      messageMeta.plainText = `[${meta.projectName}]`
      if (meta.shortSha) {
        messageMeta.mainHtml = `<code>${meta.branchName}</code> (${meta.shortSha})`
        messageMeta.plainText = `${messageMeta.plainText} ${meta.branchName} (${meta.shortSha})`
      } else {
        messageMeta.mainHtml = `${messageMeta.mainHtml} <code>${meta.branchName}</code>`
        messageMeta.plainText = `${messageMeta.plainText} ${meta.branchName}`
      }
      messageMeta.mainHtml = `${messageMeta.mainHtml} Build <code>${meta.buildName}</code> error.`
      messageMeta.plainText = `${messageMeta.plainText} Build ${meta.buildName} error.`
      messageMeta.subject = messageMeta.plainText
      if (meta.logLink){
        messageMeta.mainHtml = `${messageMeta.mainHtml} ${meta.logLink}`
        messageMeta.plainText = `${messageMeta.plainText} ${meta.logLink}`
      }
      sendToEmail(project, messageMeta, channelWrapperLogs, msg, appId)
      break;

    case "github:pull_request:closed:CannotDeleteProductionEnvironment":
    case "github:push:CannotDeleteProductionEnvironment":
    case "bitbucket:repo:push:CannotDeleteProductionEnvironment":
    case "gitlab:push:CannotDeleteProductionEnvironment":
    case "rest:remove:CannotDeleteProductionEnvironment":
      messageMeta.color = 'gold'
      messageMeta.emoji = '⚠️'
      messageMeta.mainHtml = `<code>${meta.branchName}</code> not deleted. ${meta.error}`
      messageMeta.plainText = `[${meta.name}] ${meta.branchName} not deleted.`
      messageMeta.subject = messageMeta.plainText
      messageMeta.plainText = `${messageMeta.plainText} ${meta.error}`
      sendToEmail(project, messageMeta, channelWrapperLogs, msg, appId)
      break;

    default:
      //since there's no single point of acknowlegement of the msg, we need to keep track of whether we've handled the message
      let eventHandledAsProblem =  dispatchProblemEventToEmail(event, project, message, messageMeta, channelWrapperLogs, msg, appId);
      if(!eventHandledAsProblem) {
        return channelWrapperLogs.ack(msg);
      }
  }
}

const dispatchProblemEventToEmail = (event, project, message, messageMeta, channelWrapperLogs, msg, appId) => {
  const problemEvent = parseProblemNotification(event);
  if(problemEvent.isProblem && problemEvent.eventType == 'insert') {
      messageMeta.color = 'gold'
      messageMeta.emoji = '⚠️'
      messageMeta.mainHtml = message
      messageMeta.plainText = message
      messageMeta.subject = `New Problem of severity ${problemEvent.severityLevel} detected on ${project}`
      sendToEmail(project, messageMeta, channelWrapperLogs, msg, appId, 'PROBLEM', problemEvent.severityLevel)
    return true;
    }
  return false;
};

const sendToEmail = async (project, messageMeta, channelWrapperLogs, msg, appId, contentType = 'DEPLOYMENT', severityLevel = 'NONE') => {
  let projectEmails;
  try {
    projectEmails = await getEmailInfoForProject(project, contentType)
  }
  catch (error) {
    logger.error(`No Email information found, error: ${error}`)
    return channelWrapperLogs.ack(msg)
  }

  projectEmails.forEach(projectEmail => {
    const { emailAddress } = projectEmail;

    const notificationThresholdMet = notificationContentTypeToInt(projectEmail.notificationSeverityThreshold) <= notificationContentTypeToInt(severityLevel);
    if(contentType == 'PROBLEM' && !notificationThresholdMet) { return; } //go to next iteration

    let info = transporter.sendMail({
      from: 'lagoon@amazee.io',
      to: emailAddress,
      subject: messageMeta.subject,
      text: messageMeta.plainText,
      html: `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>Test Email Sample</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0 " />
    <style>
      @import url('https://fonts.googleapis.com/css?family=Roboto&display=swap');
      body {
        font-family: 'Roboto', sans-serif;
      }
      .main{
        border-left: 10px solid ${messageMeta.color};
        padding: 10px;
      }
      ul {
        margin: 2px;
        list-style-type:none;
      }
    </style>
  </head>
  <body>
    <div class="main">
      <h2><strong>${messageMeta.emoji} [${project}]</strong></h2>
      <p>
        ${messageMeta.mainHtml}
      </p>
    </div>
    <div>
      <p>
        ${messageMeta.additional}
      </p>
    </div>
  </body>
</html>`
    });
  });
  channelWrapperLogs.ack(msg)
  return
}
