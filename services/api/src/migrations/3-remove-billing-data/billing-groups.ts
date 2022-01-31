import * as R from 'ramda';
import { logger } from '@lagoon/commons/dist/local-logging';
import { getKeycloakAdminClient } from '../../clients/keycloak-admin';
import { sqlClientPool } from '../../clients/sqlClient';
import { esClient } from '../../clients/esClient';
import redisClient from '../../clients/redisClient';
import { Group } from '../../models/group';

(async () => {
  const keycloakAdminClient = await getKeycloakAdminClient();

  const GroupModel = Group({
    sqlClientPool,
    keycloakAdminClient,
    esClient,
    redisClient
  });

  logger.debug('Removing billing groups');

  let billingGroups = [] as Group[];
  try {
    billingGroups = await GroupModel.loadGroupsByAttribute(
      ({ name, value }) => {
        return name === 'type' && value[0] === 'billing';
      }
    );
  } catch (err) {
    logger.error('Could not load billing groups');
    throw new Error(err);
  }

  if (billingGroups.length == 0) {
    logger.info('No billing groups found');
  }

  for (const group of billingGroups) {
    if (group.groups && group.groups.length > 0) {
      logger.error(`Found subgroups for "${group.name}". This is unexpected config, skipping deleting, please fix manually`);
      continue;
    }

    logger.debug(`Deleting billing group "${group.name}"`);
    await GroupModel.deleteGroup(group.id);
  }

  logger.info('Migration completed');

  return;
})();
