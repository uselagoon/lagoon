// @flow

const { logger } = require('@lagoon/commons/src/local-logging');
const {
  addProblem,
  deleteProblemsFromSource,
  getProblemsforProjectEnvironment,
} = require('@lagoon/commons/src/api');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const DRUTINY_VULNERABILITY_SOURCE_BASE = 'Drutiny';
const DRUTINY_SERVICE_NAME = 'cli';
const DRUTINY_PACKAGE_NAME = ''
const {
  getProjectByName,
  getEnvironmentByName,
} = require('@lagoon/commons/src/api');
const { generateProblemsWebhookEventName } = require("./webhookHelpers");

const ERROR_STATES = ["error", "failure"];
const SEVERITY_LEVELS = [
  "NONE",
  "UNKNOWN",
  "NEGLIGIBLE",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL"
];
const DEFAULT_SEVERITY_LEVEL = "NEGLIGIBLE";

async function processDrutinyResultset(
  webhook: WebhookRequestData,
  channelWrapperWebhooks
) {

  const { webhooktype, event, uuid, body } = webhook;
  const { lagoonInfo, results, profile: drutinyProfile } = body;

  try {
        const lagoonProjectName =
          lagoonInfo.LAGOON_DRUTINY_PROJECT_NAME ||
          lagoonInfo.LAGOON_PROJECT ||
          lagoonInfo.LAGOON_SAFE_PROJECT;

        if (!lagoonProjectName) {
          throw new Error('No project name passed in Drutiny results');
        }

        const lagoonEnvironmentName =
          lagoonInfo.LAGOON_DRUTINY_ENVIRONMENT_NAME ||
          lagoonInfo.LAGOON_ENVIRONMENT ||
          lagoonInfo.LAGOON_GIT_BRANCH;

        if (!lagoonEnvironmentName) {
          throw new Error('No environment name passed in Drutiny results');
        }

        const { id: lagoonProjectId } = await getProjectByName(
          lagoonProjectName
        );

        const {
          environmentByName: environmentDetails,
        } = await getEnvironmentByName(lagoonEnvironmentName, lagoonProjectId);

        const lagoonEnvironmentId = environmentDetails.id;
        const lagoonServiceName = DRUTINY_SERVICE_NAME;
        const drutinyVulnerabilitySource = `${DRUTINY_VULNERABILITY_SOURCE_BASE}-${drutinyProfile}`;

        //Let's get the existing problems before removing them ...
        const existingProblemSet = (
          await getProblemsforProjectEnvironment(
            lagoonEnvironmentName,
            lagoonProjectId
          )
        )
          .filter((e) => e.service == lagoonServiceName)
          .reduce((prev, current) => prev.concat([current.identifier]), []);

        await deleteProblemsFromSource(
          environmentDetails.id,
          drutinyVulnerabilitySource,
          DRUTINY_SERVICE_NAME
        );

        if (results) {
          results
            .filter((e) => ERROR_STATES.includes(e.type))
            .forEach((element) => {
              addProblem({
                environment: lagoonEnvironmentId,
                identifier: element.name,
                severity: convertSeverityLevels(element.severity),
                source: drutinyVulnerabilitySource,
                description: element.description,
                data: JSON.stringify(element),
                service: DRUTINY_SERVICE_NAME,
              })
                .then(() => {
                    sendToLagoonLogs(
                      'info',
                      lagoonProjectName,
                      uuid,
                      generateProblemsWebhookEventName({
                        source: 'drutiny',
                        severity: convertSeverityLevels(element.severity),
                        isNew: !existingProblemSet.includes(element.name)
                      }),
                      {
                        lagoonProjectId,
                        lagoonProjectName,
                        lagoonEnvironmentId,
                        lagoonEnvironmentName,
                        lagoonServiceName,
                        severity: convertSeverityLevels(element.severity),
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

const convertSeverityLevels = (level) => {
  level = level.toUpperCase();
  if(SEVERITY_LEVELS.includes(level)) {
    return level;
  }

  return DEFAULT_SEVERITY_LEVEL;
}

module.exports = processDrutinyResultset;
