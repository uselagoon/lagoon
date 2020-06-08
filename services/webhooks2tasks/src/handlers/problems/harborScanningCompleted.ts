// @flow

import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import {
  getVulnerabilitiesPayloadFromHarbor,
} from '@lagoon/commons/dist/harborApi';
import * as R from 'ramda';
import uuid4 from 'uuid4';

import {
  getProjectByName,
  getEnvironmentByName,
} from '@lagoon/commons/dist/api';

const HARBOR_WEBHOOK_SUCCESSFUL_SCAN = "Success";

export async function harborScanningCompleted(
  WebhookRequestData,
  channelWrapperWebhooks
) {
  const { webhooktype, event, uuid, body } = WebhookRequestData;

  try {
    let {
      resources,
      repository,
      scanOverview,
      lagoonProjectName,
      lagoonEnvironmentName,
      lagoonServiceName,
      harborScanId,
    } = validateAndTransformIncomingWebhookdata(body);


    if(scanOverview.scan_status !== HARBOR_WEBHOOK_SUCCESSFUL_SCAN) {
      sendToLagoonLogs(
        'error',
        '',
        uuid,
        `${webhooktype}:${event}:unhandled`,
        { data: body },
        `Received a scan report of status "${scanOverview.scan_status}" - ignoring`
      );

      return;
    }

    let vulnerabilities = await getVulnerabilitiesFromHarbor(harborScanId);

    let { id: lagoonProjectId } = await getProjectByName(lagoonProjectName);

    let { environmentByName: environmentDetails } = await getEnvironmentByName(
      lagoonEnvironmentName,
      lagoonProjectId
    );

    let messageBody = {
      lagoonProjectId,
      lagoonProjectName,
      lagoonEnvironmentId: environmentDetails.id,
      lagoonEnvironmentName: environmentDetails.name,
      lagoonServiceName,
      vulnerabilities,
    };

    const webhookData = generateWebhookData(
      WebhookRequestData.giturl,
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
    lagoonEnvironmentName,
    lagoonServiceName,
  ] = extractRepositoryDetails(repository.repo_full_name);

  return {
    resources,
    repository,
    scanOverview: scanOverviewArray.pop(),
    lagoonProjectName,
    lagoonEnvironmentName,
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
  console.log(repoFullName.split('/'));
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
    let potentialStore: any = value;
    if (potentialStore.hasOwnProperty('vulnerabilities')) {
      return potentialStore.vulnerabilities;
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

