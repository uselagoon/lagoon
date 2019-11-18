import * as R from 'ramda';
import { logger } from '@lagoon/commons/src/local-logging';
import { getSqlClient } from '../clients/sqlClient';
import { Group } from '../models/group';
import { OpendistroSecurityOperations } from '../resources/group/opendistroSecurity';
import { getKeycloakAdminClient } from '../clients/keycloak-admin';

(async () => {
  const keycloakAdminClient = await getKeycloakAdminClient();

  const sqlClient = getSqlClient();
  const GroupModel = Group({ keycloakAdminClient });

  const groups = await GroupModel.loadAllGroups();

  for (const group of groups) {
    logger.debug(`Processing ${group.name}`);
    const projectIdsArray = await GroupModel.getProjectsFromGroupAndSubgroups(group)
    const projectIds = R.join(',')(projectIdsArray)
    await OpendistroSecurityOperations(sqlClient, GroupModel).syncGroup(group.name, projectIds);
  }

  logger.info('Migration completed');

  sqlClient.destroy();
})();
