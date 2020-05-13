// @flow

const { logger } = require('@lagoon/commons/src/local-logging');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const {
  getVulnerabilitiesPayloadFromHarbor,
} = require('@lagoon/commons/src/harborApi');
const R = require('ramda');
const uuid4 = require('uuid4');

const {
  getProjectByName,
  getEnvironmentByName,
} = require('@lagoon/commons/src/api');

async function harborScanningCompleted(
  webhook: WebhookRequestData,
  channelWrapperWebhooks
) {
  const { webhooktype, event, uuid, body } = webhook;

  try {
    let {
      resources,
      repository,
      scanOverview,
      lagoonProjectName,
      LagoonEnvironmentName,
      lagoonServiceName,
      harborScanId,
    } = validateAndTransformIncomingWebhookdata(body);

    let vulnerabilities = await getVulnerabilitiesFromHarbor(harborScanId);

    let { id: lagoonProjectId } = await getProjectByName(lagoonProjectName);

    let { environmentByName: environmentDetails } = await getEnvironmentByName(
      LagoonEnvironmentName,
      lagoonProjectId
    );

    let messageBody = {
      lagoonProjectId,
      lagoonEnvironmentId: environmentDetails.id,
      lagoonServiceName,
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
  }
}

/**
 * This function will take an incoming Harbor webhook and decompose it
 * into a more useable format
 *
 * @param {*} rawData
 */
const validateAndTransformIncomingWebhookdata = (rawData) => {
  let { resources, repository } = rawData.event_data;

  if (!repository.repo_full_name) {
    throw generateError(
      'InvalidHarborInput',
      'Unable to find repo_full_name in body.event_data.repository'
    );
  }

  // scan_overview is tricky because the property doesn't have an obvious name.
  // We convert it to an array of objects with the old property as a member
  let scanOverviewArray = R.toPairs(resources[0].scan_overview).map((e) => {
    let obj = e[1];
    obj.scan_key = e[0];
    return obj;
  });

  let [
    lagoonProjectName,
    LagoonEnvironmentName,
    lagoonServiceName,
  ] = extractRepositoryDetails(repository.repo_full_name);

  return {
    resources,
    repository,
    scanOverview: scanOverviewArray.pop(),
    lagoonProjectName,
    LagoonEnvironmentName,
    lagoonServiceName,
    harborScanId: repository.repo_full_name,
  };
};

const generateError = (name, message) => {
  let e = new Error(message);
  e.name = name;
  return e;
};

const extractRepositoryDetails = (repoFullName) => {
  const pattern = /^(.+)\/(.+)\/(.+)$/;

  // if(!pattern.test(repoFullName)) {
  //   throw new ProblemsInvalidWebhookData("'" + repoFullName + "' does not conform to the appropriate structure of Project/Environment/Service")
  // }

  return repoFullName.split('/');
};

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
    if (value.hasOwnProperty('vulnerabilities')) {
      return value.vulnerabilities;
    }
  }
  throw new ProblemsHarborConnectionError(
    "Scan response from Harbor does not contain a 'vulnerabilities' key"
  );
};

const getVulnerabilitiesFromHarbor = async (scanId) => {
  let harborPayload = null;
  try {
    harborPayload = await getVulnerabilitiesPayloadFromHarbor(
      scanId
    );
  } catch (error) {
    throw error;
  }

  return extractVulnerabilities(harborPayload);
};

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
