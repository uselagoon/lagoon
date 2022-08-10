require('util').inspect.defaultOptions.depth = null;

import * as R from 'ramda';
import { logger } from '../loggers/logger';
import { getConfigFromEnv } from '../util/config';
import { sqlClientPool } from '../clients/sqlClient';
import { esClient } from '../clients/esClient';
import redisClient from '../clients/redisClient';
import { getKeycloakAdminClient } from '../clients/keycloak-admin';
import { Group } from '../models/group';
import { OpendistroSecurityOperations } from '../resources/group/opendistroSecurity';

(async () => {
  logger.trace(`Begin`);

  const keycloakAdminClient = await getKeycloakAdminClient();
  const GroupModel = Group({
    sqlClientPool,
    keycloakAdminClient,
    esClient,
    redisClient
  });

  logger.trace('Loading all groups');
  const allGroups = await GroupModel.loadAllGroups();

  const groupRegex = getConfigFromEnv('GROUP_REGEX', '.*');
  let groupsQueue = (allGroups as Group[])
    .filter(group => R.test(new RegExp(groupRegex), group.name))
    .map(group => ({
      group,
      retries: 0
    }));

  logger.info(
    `Syncing ${groupsQueue.length} groups that match /${groupRegex}/`
  );

  while (groupsQueue.length > 0) {
    const { group, retries } = groupsQueue.shift();

    try {
      logger.debug(`Processing (${group.name})`);
      const projectIdsArray = await GroupModel.getProjectsFromGroupAndSubgroups(
        group
      );
      const projectIds = R.join(',', projectIdsArray);

      let roleName: string;
      let tenantName = roleName = group.name;
      if (R.propEq('type', 'project-default-group', group)) {
        roleName = 'p' + projectIds;
        tenantName = 'global_tenant';
      }

      await OpendistroSecurityOperations(
        sqlClientPool,
        GroupModel
      ).syncGroupWithSpecificTenant(roleName, tenantName, projectIds);
    } catch (err) {
      if (retries < 3) {
        logger.warn(`Error syncing (${group.name}), adding to end of queue: ${err.message}`);
        groupsQueue.push({ group, retries: retries + 1 });
      } else {
        logger.error(`Sync failed for (${group.name}): ${err.message}`);
      }
    }
  }

  logger.info('Sync completed');
  process.exit();
})();
