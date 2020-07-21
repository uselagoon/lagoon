// @flow

import {
  addFact,
  deleteFact,
} from'@lagoon/commons/dist/api';

import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';

import {
  getProjectByName,
  getEnvironmentByOpenshiftProjectName,
  getOpenShiftInfoForProject,
} from '@lagoon/commons/dist/api';

import * as R from 'ramda';

const FACT_SECRET_TOKEN = process.env.FACT_SECRET_TOKEN || 'default';

export async function processFactSet(
  WebhookRequestData,
  channelWrapperWebhooks
) {

  const { webhooktype, event, uuid, body } = WebhookRequestData;
  const { LAGOON_PROJECT, LAGOON_ENVIRONMENT, TOKEN, facts } = body;

  try {

        if(FACT_SECRET_TOKEN !== TOKEN) {
          throw new Error('Rejecting Fact Set - TOKEN incorrect');
        }

        const lagoonProjectName = LAGOON_PROJECT;
        if (!lagoonProjectName) {
          throw new Error('No project name passed in Fact set');
        }

        const lagoonEnvironmentName = LAGOON_ENVIRONMENT;
        if (!lagoonEnvironmentName) {
          throw new Error('No environment name passed in Fact set');
        }

        const { id: lagoonProjectId } = await getProjectByName(
          lagoonProjectName
        );

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

        const lagoonEnvironmentId = environmentDetails.id;

        if (facts) {
          facts.forEach(async (element) => {
              deleteFact({environment: lagoonEnvironmentId, name: element.name }).then(
              () => addFact({
                environment: lagoonEnvironmentId,
                name: element.name,
                value: element.value,
              })).catch((error) =>
                  sendToLagoonLogs(
                    'error',
                    '',
                    uuid,
                    `${webhooktype}:${event}:fact_insert_error`,
                    { data: body },
                    `Error inserting fact ${element.name} for ${lagoonProjectId}:${environmentDetails.id} -- ${error.message}`
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
      `Could not process incoming Fact set results, reason: ${error}`
    );
  }
}

