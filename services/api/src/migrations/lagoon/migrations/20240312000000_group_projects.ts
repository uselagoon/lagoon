import * as R from 'ramda';
import { logger } from '@lagoon/commons/dist/logs/local-logger';
import { getKeycloakAdminClient } from '../../../clients/keycloak-admin';
import { sqlClientPool } from '../../../clients/sqlClient';
import { esClient } from '../../../clients/esClient';
import { Group } from '../../../models/group';
import { Helpers } from '../../../resources/group/helpers';

export const up = async (migrate) => {
  const keycloakAdminClient = await getKeycloakAdminClient();

  const GroupModel = Group({
    sqlClientPool,
    keycloakAdminClient,
    esClient,
  });

  // load all groups from keycloak
  const allGroups = await GroupModel.loadAllGroups();
  // flatten them out
  const flattenGroups = (groups, group) => {
    groups.push(R.omit(['subGroups'], group));
    const flatSubGroups = group.subGroups.reduce(flattenGroups, []);
    return groups.concat(flatSubGroups);
  };
  const fgs = R.pipe(
    R.reduce(flattenGroups, []),
    )(allGroups)
  // loop over the groups ignoring `role-subgroup` groups
  for (const fg of fgs) {
    if (fg.attributes['type'] != "role-subgroup") {
      const groupProjects = await GroupModel.getProjectsFromGroup(fg);
      for (const pid of groupProjects) {
        logger.info(`Migrating project ${pid} and group ${fg.name}/${fg.id} to database`)
        // add the project group association to the database
        await Helpers(sqlClientPool).addProjectToGroup(pid, fg.id)
      }
      // if the group is in an organization
      if (R.prop('lagoon-organization', fg.attributes)) {
        // add the organization group association to the database
        logger.info(`Migrating group ${fg.name}/${fg.id} in organization ${R.prop('lagoon-organization', fg.attributes)} to database`)
        await Helpers(sqlClientPool).addOrganizationToGroup(parseInt(R.prop('lagoon-organization', fg.attributes)[0], 10), fg.id)
      }
    }
  }

  return migrate.schema
}

export const down = async (migrate) => {
  return migrate.schema
}
