// @flow

const { logger } = require('@lagoon/commons/src/local-logging');
const {
  addProblem,
  deleteProblemsFromSource,
} = require('@lagoon/commons/src/api');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const DRUTINY_VULNERABILITY_SOURCE_BASE = 'Drutiny';
const DRUTINY_SERVICE_NAME = 'cli';
const DRUTINY_PACKAGE_NAME = ''
const {
  getProjectByName,
  getEnvironmentByName,
} = require('@lagoon/commons/src/api');

async function processDrutinyResultset(
  webhook: WebhookRequestData,
  channelWrapperWebhooks
) {
  const { webhooktype, event, uuid, body } = webhook;

  const { lagoonInfo, results, profile: drutinyProfile } = body;

  try {
    const lagoonProjectName =
      lagoonInfo.LAGOON_SAFE_PROJECT || lagoonInfo.LAGOON_PROJECT;

    let { id: lagoonProjectId } = await getProjectByName(lagoonProjectName);

    let { environmentByName: environmentDetails } = await getEnvironmentByName(
      lagoonInfo.LAGOON_ENVIRONMENT,
      lagoonProjectId
    );

    let lagoonEnvironmentName = environmentDetails.name;
    let lagoonEnvironmentId = environmentDetails.id;
    let lagoonServiceName = DRUTINY_SERVICE_NAME;
    let drutinyVulnerabilitySource = `${DRUTINY_VULNERABILITY_SOURCE_BASE}`;

    await deleteProblemsFromSource(
      environmentDetails.id,
      drutinyVulnerabilitySource,
      DRUTINY_SERVICE_NAME
    );

    if (results) {
      results
        .filter((e) => e.type == 'error')
        .forEach((element) => {
          addProblem({
            environment: lagoonEnvironmentId,
            identifier: element.name,
            severity: element.severity.toUpperCase(),
            source: drutinyVulnerabilitySource,
            description: element.description,
            data: JSON.stringify(element),
            service: DRUTINY_SERVICE_NAME,
            package: drutinyProfile,
          })
            .then(() => {
              sendToLagoonLogs(
                'info',
                lagoonProjectName,
                uuid,
                '${webhooktype}:${event}:problem_added',
                {
                  lagoonProjectId,
                  lagoonProjectName,
                  lagoonEnvironmentId,
                  lagoonEnvironmentName,
                  lagoonServiceName,
                  severity: element.severity.toUpperCase(),
                  vulnerability: element,
                },
                `New problem found for ${lagoonProjectName}:${lagoonEnvironmentName}:${lagoonServiceName}. Severity: ${element.severity}. Description: ${element.description}`
              );
            })
            .catch((error) =>
              sendToLagoonLogs(
                'error',
                '',
                uuid,
                `${webhooktype}:${event}:problem_insert_error`,
                { data: body },
                `Error inserting problem id ${element.id} for ${lagoonProjectId}:${environmentDetails.id} -- ${error.message}`
              )
            );
        });
    }
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:unhandled`,
      { data: body },
      `Could not process incoming Drutiny scan results, reason: ${error}`
    );
  }
}

module.exports = processDrutinyResultset;
