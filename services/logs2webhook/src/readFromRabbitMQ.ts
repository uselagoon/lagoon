import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { logger } from '@lagoon/commons/dist/local-logging';
import { getWebhookNotificationInfoForProject } from '@lagoon/commons/dist/api';
import { notificationIntToContentType, notificationContentTypeToInt, parseProblemNotification } from '@lagoon/commons/dist/notificationCommons';
import { URL } from 'url';
import http from 'https';

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
      sendToWebhook(event, project, message, '#E8E8E8', meta, channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:finished":
    case "task:remove-openshift:finished":
    case "task:remove-kubernetes:finished":
    case "task:remove-openshift-resources:finished":
    case "task:builddeploy-openshift:complete":
    case "task:builddeploy-kubernetes:complete":
      sendToWebhook(event, project, message, 'good', meta, channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:retry":
    case "task:remove-openshift:retry":
    case "task:remove-kubernetes:retry":
    case "task:remove-openshift-resources:retry":
      sendToWebhook(event, project, message, 'warning', meta, channelWrapperLogs, msg, appId)
      break;

    case "task:deploy-openshift:error":
    case "task:remove-openshift:error":
    case "task:remove-kubernetes:error":
    case "task:remove-openshift-resources:error":
    case "task:builddeploy-openshift:failed":
    case "task:builddeploy-kubernetes:failed":
      sendToWebhook(event, project, message, 'danger', meta, channelWrapperLogs, msg, appId)
      break;

    case "github:pull_request:closed:CannotDeleteProductionEnvironment":
    case "github:push:CannotDeleteProductionEnvironment":
    case "bitbucket:repo:push:CannotDeleteProductionEnvironment":
    case "gitlab:push:CannotDeleteProductionEnvironment":
    case "rest:remove:CannotDeleteProductionEnvironment":
      sendToWebhook(event, project, message, 'warning', meta, channelWrapperLogs, msg, appId)
      break;
    default:
        //since there's no single point of acknowlegement of the msg, we need to keep track of whether we've handled the message
        let eventHandledAsProblem =  dispatchProblemEventToWebhook(event, project, message, meta, channelWrapperLogs, msg, appId);
        if(!eventHandledAsProblem) {
          return channelWrapperLogs.ack(msg);
        }
  }
}

const dispatchProblemEventToWebhook = (event, project, message, meta, channelWrapperLogs, msg, appId) => {
  const problemEvent = parseProblemNotification(event);
  if(problemEvent.isProblem) {
    const isNewProblem = problemEvent.eventType == 'insert';
    if(isNewProblem || true) {
      sendToWebhook(event, project, message, 'warning', meta, channelWrapperLogs, msg, appId, 'PROBLEM', problemEvent.severityLevel)
      return true;
    }
  }
  return false;
};

const sendToWebhook = async (event, project, message, color, meta, channelWrapperLogs, msg, appId, contentType = 'DEPLOYMENT', severityLevel = 'NONE') => {

  let projectWebhooks;
  try {
    projectWebhooks = await getWebhookNotificationInfoForProject(project, contentType)
  }
  catch (error) {
    logger.error(`No Webhook information found, error: ${error}`)
    return channelWrapperLogs.ack(msg)
  }


  projectWebhooks.forEach(projectWebhook => {
    const notificationThresholdMet = notificationContentTypeToInt(projectWebhook.notificationSeverityThreshold) <= notificationContentTypeToInt(severityLevel);
    if(contentType == 'PROBLEM' && !notificationThresholdMet) { return; } //go to next iteration

    const { webhook } = projectWebhook;
    const webhookUrl = new URL(webhook);

    var data = JSON.stringify(
      {
        event: event,
        project: project,
        meta: meta,
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
