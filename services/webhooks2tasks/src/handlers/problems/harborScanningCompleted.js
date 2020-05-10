// @flow

const { logger } = require('@lagoon/commons/src/local-logging');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { getVulnerabilitiesPayloadFromHarbor } = require('@lagoon/commons/src/harborApi');
const uuid4 = require('uuid4');


const {
  getProjectByName,
  getEnvironmentByName,
} = require('@lagoon/commons/src/api');

const harborpassword = require('./harborpassword');


async function harborScanningCompleted(
  webhook: WebhookRequestData,
  channelWrapperWebhooks
) {
  const {
    webhooktype,
    event,
    uuid,
    body } = webhook;

  try {
    let { resources, repository } = body.event_data;

    const [
      lagoonProjectName,
      LagoonEnvironmentName,
      lagoonServiceName = null,
    ] = extractRepositoryDetails(repository.repo_full_name);

    if(!repository.repo_full_name) {
      throw generateError('InvalidHarborInput', "Unable to find repo_full_name in body.event_data.repository");
    }

    let harborScanId =repository.repo_full_name;

    let vulnerabilities = await getVulnerabilitiesFromHarbor(harborScanId);

    let { id: lagoonProjectId } = await getProjectByName(lagoonProjectName);

    let { environmentByName: environmentDetails } = await getEnvironmentByName(
      LagoonEnvironmentName,
      lagoonProjectId
    );

    let messageBody = {
      lagoonProjectId,
      lagoonEnvironmentId: environmentDetails.id,
      vulnerabilities,
    };


    const webhookData = generateWebhookData(
      webhook.giturl,
      'problems',
      'harbor:scanningresultfetched',
      messageBody
    );

    const buffer = new Buffer(JSON.stringify(webhookData));
    await channelWrapperWebhooks.publish(`lagoon-webhooks`, '', buffer, {
      persistent: true,
    });
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not fetch Harbor scan results, reason: ${error}`
    );

    return;
  }
}

const generateError = (name, message) => {
  let e = new Error(message);
  e.name = name;
  return e;
}

const extractRepositoryDetails = (repoFullName) => {
  const pattern = /^(.+)\/(.+)\/(.+)$/;

  // if(!pattern.test(repoFullName)) {
  //   throw new ProblemsInvalidWebhookData("'" + repoFullName + "' does not conform to the appropriate structure of Project/Environment/Service")
  // }

  return repoFullName.split('/');
}

const generateWebhookData = (
  webhookGiturl,
  webhooktype,
  event,
  body,
  id = null
) => {
  return {
    webhooktype: webhooktype,
    event: event,
    giturl: webhookGiturl,
    uuid: id ? id : uuid4(),
    body: body,
  };
};

const extractVulnerabilities = (harborScanResponse) => {
  for (let [key, value] of Object.entries(harborScanResponse)) {
    console.log(key);
    if (value.hasOwnProperty('vulnerabilities')) {
      return value.vulnerabilities;
    }
  }
  throw new ProblemsHarborConnectionError('Scan response from Harbor does not contain a \'vulnerabilities\' key');
};


const getVulnerabilitiesFromHarbor = async (scanId) => {
  let harborPayload = null;
  try {
    harborPayload = await getVulnerabilitiesPayloadFromHarbor(scanId, harborpassword);
  }
  catch(error) {
    throw error;
  }

  return extractVulnerabilities(harborPayload);
}

class ProblemsHarborConnectionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'problems-harborConnectionError';
  }
}

class ProblemsInvalidWebhookData extends Error {
  constructor(message) {
    super(message);
    this.name = 'problems-invalidWebhookData';
  }
}

module.exports = harborScanningCompleted;
