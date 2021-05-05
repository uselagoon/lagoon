import * as R from 'ramda';
import { logger } from '@lagoon/commons/dist/local-logging';
import { sqlClientPool } from '../clients/sqlClient';
import { esClient } from '../clients/esClient';
import redisClient from '../clients/redisClient';
import { Group } from '../models/group';
import { OpendistroSecurityOperations } from '../resources/group/opendistroSecurity';
import { getKeycloakAdminClient } from '../clients/keycloak-admin';

(async () => {
  const keycloakAdminClient = await getKeycloakAdminClient();
  const GroupModel = Group({
    sqlClientPool,
    keycloakAdminClient,
    esClient,
    redisClient
  });

  const groupRegex = process.env.GROUP_REGEX
    ? new RegExp(process.env.GROUP_REGEX)
    : /.*/;

  const allGroups = await GroupModel.loadAllGroups();
  let groupsQueue = (allGroups as Group[]).map(group => ({
    group,
    retries: 0
  }));

  logger.info(`Syncing ${allGroups.length} groups`);

  while (groupsQueue.length > 0) {
    const { group, retries } = groupsQueue.shift();

    if (!R.test(groupRegex, group.name)) {
      logger.info(`Skipping ${group.name}`);
      continue;
    }

    try {
      logger.debug(`Processing ${group.name}`);
      const projectIdsArray = await GroupModel.getProjectsFromGroupAndSubgroups(
        group
      );
      const projectIds = R.join(',')(projectIdsArray);
      await OpendistroSecurityOperations(sqlClientPool, GroupModel).syncGroup(
        group.name,
        projectIds
      );
    } catch (err) {
      if (retries < 3) {
        logger.warn(`Error syncing, adding to end of queue: ${err.message}`);
        groupsQueue.push({ group, retries: retries + 1 });
      } else {
        logger.error(`Sync failed: ${err.message}`);
      }
    }
  }

  logger.info('Sync completed');
})();
