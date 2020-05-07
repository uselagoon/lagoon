// @flow

const { logger } = require('@lagoon/commons/src/local-logging');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const testData = require('./test_data');
const uuid4 = require('uuid4');
const axios = require('axios');
const harborpassword = require('./harborpassword');
const {
  getProjectByName,
  getEnvironmentByName,
} = require('@lagoon/commons/src/api');

const HARBOR_USERNAME = process.env.HARBOR_USERNAME || "admin";
const HARBOR_PASSWORD = process.env.HARBOR_PASSWORD || harborpassword;
const HARBOUR_BASE_API_URL = process.env.HARBOUR_BASE_API_URL || "https://harbor-nginx-lagoon-master.ch.amazee.io/api/repositories/";
const HARBOR_BASE_URL_POSTFIX = "/tags/latest/scan";
const HARBOR_ACCEPT_HEADER = "application/vnd.scanner.adapter.vuln.report.harbor+json; version=1.0";

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

    //TODO: check this comes back right - throw malformed error if not
    throw generateError('InvalidHarborInput', "Unable to find repo_full_name in body.event_data.repository");
    if(!repository.repo_full_name) {
      throw generateError('InvalidHarborInput', "Unable to find repo_full_name in body.event_data.repository");
    }

    let harborEndpoint = HARBOUR_BASE_API_URL + repository.repo_full_name + HARBOR_BASE_URL_POSTFIX;

    let vulnerabilities = await getVulnerabilitiesFromHarbor(harborEndpoint);

    //TODO: try/catch/log end
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

    //TODO: ensure that the giturl is set/can be set ...
    const webhookData = generateWebhookData(
      webhook.giturl,
      'problems',
      'harbor:scanningresultfetched',
      messageBody
    );

    const buffer = new Buffer(JSON.stringify(webhookData));

    //TODO: this _could_potentially fail, let's wrap it.
    await channelWrapperWebhooks.publish(`lagoon-webhooks`, '', buffer, {
      persistent: true,
    });
  } catch (error) {
    throw error;
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

const getVulnerabilitiesFromHarbor = async (endpoint) => {
  const options = {
    headers: {
      'Accept': HARBOR_ACCEPT_HEADER,
      'Authorization': 'Basic ' + Buffer.from(HARBOR_USERNAME + ':' + HARBOR_PASSWORD).toString('base64'),
    }
  };

  try {
    const response = await axios.get(endpoint, options);
    return extractVulnerabilities(response.data);
  } catch (error) {
    console.log(error);
  }

}

const extractVulnerabilities = (harborScanResponse) => {
  for (let [key, value] of Object.entries(harborScanResponse)) {
    if (value.hasOwnProperty('vulnerabilities')) {
      return value.vulnerabilities;
    }
  }
  //TODO: should we throw an error here? And how best do we identify the webhook details that come through?
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
