// @flow

//TODO:
// 1 - replace console.logs with actual lagoon log errors
// 2 - add Jest tests for Harbor v1 and v2 for validateAndTransformIncomingWebhookdata - this is where the rubber hits the road.
// 3 - add Jest tests for extractVulnerabilities

import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import {
  getVulnerabilitiesPayloadFromHarbor,
} from '@lagoon/commons/dist/harborApi';
import * as R from 'ramda';
import uuid4 from 'uuid4';
import {extractVulnerabilities, matchRepositoryAgainstPatterns, generateError, validateAndTransformIncomingWebhookdata} from './harborHelpers'

import {
  getProjectByName,
  getProblemHarborScanMatches,
  getEnvironmentByOpenshiftProjectName,
  getOpenShiftInfoForProject,
} from '@lagoon/commons/dist/api';

const PROBLEMS_HARBOR_FILTER_FLAG = process.env.PROBLEMS_HARBOR_FILTER_FLAG || null;

 export async function harborScanningCompleted(
  WebhookRequestData,
  channelWrapperWebhooks
) {
  const { webhooktype, event, uuid, body } = WebhookRequestData;
  const HARBOR_WEBHOOK_SUCCESSFUL_SCAN = "Success";

  let harborScanPatternMatchers = await getProblemHarborScanMatches();

  try {
    let {
      resources,
      repository,
      scanOverview,
      lagoonProjectName,
      lagoonEnvironmentName,
      lagoonServiceName,
      harborScanId,
    } = await validateAndTransformIncomingWebhookdata(harborScanPatternMatchers.allProblemHarborScanMatchers, body);

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


    let { id: lagoonProjectId, problemsUi } = await getProjectByName(lagoonProjectName);

    //Here, before we get any further, we only let through projects that have the problemsUI enabled
    if(PROBLEMS_HARBOR_FILTER_FLAG && problemsUi == 0) {
      console.log(`Filter enabled: skipping harbor processing for ${lagoonProjectName}:${lagoonEnvironmentName}:${lagoonServiceName}`)
      return;
    }

    let vulnerabilities = [];
    vulnerabilities = await getVulnerabilitiesFromHarbor(repository);

    const result = await getOpenShiftInfoForProject(lagoonProjectName);
    const projectOpenShift = result.project;

    const ocsafety = string =>
    string.toLocaleLowerCase().replace(/[^0-9a-z-]/g, '-');

    let openshiftProjectName = projectOpenShift.openshiftProjectPattern
    ? projectOpenShift.openshiftProjectPattern
        .replace('${branch}', ocsafety(lagoonEnvironmentName))
        .replace('${project}', ocsafety(lagoonProjectName))
    : ocsafety(`${lagoonProjectName}-${lagoonEnvironmentName}`);

    const environmentResult = await getEnvironmentByOpenshiftProjectName(openshiftProjectName);
    const environmentDetails: any = R.prop('environmentByOpenshiftProjectName', environmentResult)


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



const getVulnerabilitiesFromHarbor = async (repository) => {
  let harborPayload = null;
  try {
    harborPayload = await getVulnerabilitiesPayloadFromHarbor(
      repository, {}
    );
  } catch (error) {
    throw error;
  }

  return extractVulnerabilities(harborPayload);
};
