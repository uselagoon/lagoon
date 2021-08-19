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

  // This filters out Billing Groups that we don't need to create in Opendistro/Kibana
  const userGroups = allGroups.filter(
    ({ type }) => type !== 'billing' && type !== 'billing-poly'
  );

  let groupsQueue = (userGroups as Group[]).map(group => ({
    group,
    retries: 0
  }));

  logger.info(`Syncing ${userGroups.length} groups`);

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

      let roleName = group.name;
      if(group.type && group.type == 'project-default-group') {
        roleName = "p" + projectIds;
      }

      let tenantName = group.name;
      if(group.type && group.type == 'project-default-group') {
        tenantName = 'global_tenant';
      }

      await OpendistroSecurityOperations(sqlClientPool, GroupModel).syncGroupWithSpecificTenant(
        roleName,
        tenantName,
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
