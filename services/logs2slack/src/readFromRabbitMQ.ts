import { IncomingWebhook } from '@slack/client';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { logger } from '@lagoon/commons/dist/local-logging';
import { getSlackinfoForProject } from '@lagoon/commons/dist/api';
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

  switch (event) {

    case "github:pull_request:closed:handled":
    case "github:pull_request:opened:handled":
    case "github:pull_request:synchronize:handled":
    case "github:delete:handled":
    case "github:push:handled":
    case "bitbucket:repo:push:handled":
    case "bitbucket:pullrequest:created:handled":
    case "bitbucket:pullrequest:updated:handled":
    case "bitbucket:pullrequest:fulfilled:handled":
    case "bitbucket:pullrequest:rejected:handled":
    case "gitlab:push:handled":
    case "gitlab:merge_request:opened:handled":
    case "gitlab:merge_request:updated:handled":
    case "gitlab:merge_request:closed:handled":
    case "rest:deploy:receive":
    case "rest:remove:receive":
    case "rest:promote:receive":
    case "api:deployEnvironmentLatest":
    case "api:deployEnvironmentBranch":
    case "api:deleteEnvironment":
    case "github:push:skipped":
    case "gitlab:push:skipped":
    case "bitbucket:push:skipped":
      sendToSlack(project, message, '#E8E8E8', ':information_source:', channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:finished":
    case "task:remove-openshift:finished":
    case "task:remove-kubernetes:finished":
    case "task:remove-openshift-resources:finished":
    case "task:builddeploy-openshift:complete":
    case "task:builddeploy-kubernetes:complete":
      sendToSlack(project, message, 'good', ':white_check_mark:', channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:retry":
    case "task:remove-openshift:retry":
    case "task:remove-kubernetes:retry":
    case "task:remove-openshift-resources:retry":
      sendToSlack(project, message, 'warning', ':warning:', channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:error":
    case "task:remove-openshift:error":
    case "task:remove-kubernetes:error":
    case "task:remove-openshift-resources:error":
    case "task:builddeploy-openshift:failed":
    case "task:builddeploy-kubernetes:failed":
      sendToSlack(project, message, 'danger', ':bangbang:', channelWrapperLogs, msg, appId)
      break;

    case "github:pull_request:closed:CannotDeleteProductionEnvironment":
    case "github:push:CannotDeleteProductionEnvironment":
    case "bitbucket:repo:push:CannotDeleteProductionEnvironment":
    case "gitlab:push:CannotDeleteProductionEnvironment":
    case "rest:remove:CannotDeleteProductionEnvironment":
      sendToSlack(project, message, 'warning', ':warning:', channelWrapperLogs, msg, appId)
      break;
    default:
        //since there's no single point of acknowlegement of the msg, we need to keep track of whether we've handled the message
        let eventHandledAsProblem =  dispatchProblemEventToSlack(event, project, message, channelWrapperLogs, msg, appId);
        if(!eventHandledAsProblem) {
          return channelWrapperLogs.ack(msg);
        }
  }
}

const dispatchProblemEventToSlack = (event, project, message, channelWrapperLogs, msg, appId) => {
  const problemEvent = parseProblemNotification(event);
  if(problemEvent.isProblem) {
    const isNewProblem = problemEvent.eventType == 'insert';
    if(isNewProblem) {
      sendToSlack(project, message, 'warning', ':warning:', channelWrapperLogs, msg, appId, 'PROBLEM', problemEvent.severityLevel)
      return true;
    }
  }
  return false;
};

const sendToSlack = async (project, message, color, emoji, channelWrapperLogs, msg, appId, contentType = 'DEPLOYMENT', severityLevel = 'NONE') => {

  let projectSlacks;
  try {
    projectSlacks = await getSlackinfoForProject(project, contentType)
  }
  catch (error) {
    logger.error(`No Slack information found, error: ${error}`)
    return channelWrapperLogs.ack(msg)
  }
  projectSlacks.forEach(async (projectSlack) => {

    const notificationThresholdMet = notificationContentTypeToInt(projectSlack.notificationSeverityThreshold) <= notificationContentTypeToInt(severityLevel);
    if(contentType == 'PROBLEM' && !notificationThresholdMet) { return; } //go to next iteration

    await new IncomingWebhook(projectSlack.webhook, {
      channel: projectSlack.channel,
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
