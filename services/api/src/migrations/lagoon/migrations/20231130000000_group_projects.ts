import * as R from 'ramda';
import { logger } from '@lagoon/commons/dist/logs/local-logger';
import { getKeycloakAdminClient } from '../../../clients/keycloak-admin';
import { sqlClientPool } from '../../../clients/sqlClient';
import { esClient } from '../../../clients/esClient';
import redisClient from '../../../clients/redisClient';
import { Group } from '../../../models/group';
import { Helpers } from '../../../resources/group/helpers';

export const up = async (migrate) => {
  const keycloakAdminClient = await getKeycloakAdminClient();

  const GroupModel = Group({
    sqlClientPool,
    keycloakAdminClient,
    esClient,
    redisClient
  });

  // load all groups from keycloak
  const allGroups = await GroupModel.loadAllGroups();
  // transform them into lagoon expected format
  const keycloakGroups = await GroupModel.transformKeycloakGroups(allGroups);
  for (const kg of keycloakGroups) {
    // extract the project ids from the group
    const groupProjects = await GroupModel.getProjectsFromGroupAndSubgroups(kg);
    for (const pid of groupProjects) {
      // add them to the database
      logger.info(`Migrating project ${pid} and groupId ${kg.id} to database`)
      await Helpers(sqlClientPool).addProjectToGroup(pid, kg.id)
    }
    // if the group is in an organization
    if (R.prop('lagoon-organization', kg.attributes)) {
      // add it to the database
      logger.info(`Migrating groupId ${kg.id} in organization ${R.prop('lagoon-organization', kg.attributes)} to database`)
      await Helpers(sqlClientPool).addOrganizationToGroup(parseInt(R.prop('lagoon-organization', kg.attributes)[0], 10), kg.id)
    }
  }

  return migrate.schema
}

export const down = async (migrate) => {
  return migrate.schema
}
