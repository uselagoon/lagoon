// @flow

const { logger } = require('@lagoon/commons/src/local-logging');
const testData = require('./test_data');
const uuid4 = require('uuid4');
const https = require('https');
const { getProjectByName, getEnvironmentByName } = require('@lagoon/commons/src/api');

async function harborScanningCompleted(webhook: WebhookRequestData, channelWrapperWebhooks) {
  const {
    webhooktype,
    event,
    uuid,
    body
  } = webhook;

  let {resources, repository} = body.event_data;

  vulnerabilities = extractVulnerabilities(testData);

  let harborEndpoint = resources.resource_url;

  //structure of the repo_full_name should be project/environment,service
  const [lagoonProjectName, LagoonEnvironmentName, lagoonServiceName = null] = repository.repo_full_name.split('/');

  let {id: lagoonProjectId} = await getProjectByName(lagoonProjectName);

  let {environmentByName: environmentDetails} = await getEnvironmentByName(LagoonEnvironmentName, lagoonProjectId);

  let messageBody = {
    lagoonProjectId,
    lagoonEnvironmentId: environmentDetails.id,
    vulnerabilities,
  };

  const webhookData = generateWebhookData(webhook.giturl, 'problems', 'harbor:scanningresultfetched', messageBody);
  const buffer = new Buffer(JSON.stringify(webhookData));
  await channelWrapperWebhooks.publish(`lagoon-webhooks`, '', buffer, { persistent: true });
}


const extractVulnerabilities = (harborScanResponse) => {
  for( let [key, value] of Object.entries(harborScanResponse)) {
    if(value.hasOwnProperty("vulnerabilities")) {
      return value.vulnerabilities;
    }
  }
}

const generateWebhookData = (webhookGiturl, webhooktype, event, body, id = null) => {
  return {
    webhooktype: webhooktype,
    event: event,
    giturl: webhookGiturl,
    uuid: id ? id : uuid4(),
    body: body
  }
};


module.exports = harborScanningCompleted;