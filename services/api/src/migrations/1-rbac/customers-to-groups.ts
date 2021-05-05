import * as R from 'ramda';
import { logger } from '@lagoon/commons/dist/local-logging';
import { getKeycloakAdminClient } from '../../clients/keycloak-admin';
import { sqlClientPool } from '../../clients/sqlClient';
import { esClient } from '../../clients/esClient';
import redisClient from '../../clients/redisClient';
import { mQuery } from '../../util/db';
import { Group, GroupNotFoundError } from '../../models/group';
import { User } from '../../models/user';

(async () => {
  const keycloakAdminClient = await getKeycloakAdminClient();

  const GroupModel = Group({
    sqlClientPool,
    keycloakAdminClient,
    esClient,
    redisClient
  });
  const UserModel = User({
    sqlClientPool,
    keycloakAdminClient,
    esClient,
    redisClient
  });

  try {
    logger.debug('Removing current keycloak groups');
    const currentGroups = await GroupModel.loadAllGroups();
    const currentGroupIds = R.pluck('id', currentGroups);

    for (const currentGroupId of currentGroupIds) {
      await GroupModel.deleteGroup(currentGroupId);
    }
  } catch (err) {
    logger.error(
      'Could not delete current keycloak groups. Due to group/sub-group hiearchy, this could be normal. Please try again.'
    );
    throw new Error(err);
  }

  const customerRecords = await mQuery(
    sqlClientPool,
    'SELECT * FROM `customer`'
  );

  for (const customer of customerRecords) {
    logger.debug(`Processing ${customer.name}`);

    // Add or update group
    let keycloakGroup;
    try {
      const existingGroup = await GroupModel.loadGroupByName(customer.name);
      keycloakGroup = await GroupModel.updateGroup({
        id: existingGroup.id,
        name: existingGroup.name,
        attributes: {
          ...existingGroup.attributes,
          comment: [
            R.propOr(
              R.path(['attributes', 'comment', 0], existingGroup),
              'comment',
              customer
            )
          ]
        }
      });
    } catch (err) {
      if (err instanceof GroupNotFoundError) {
        try {
          keycloakGroup = await GroupModel.addGroup({
            name: R.prop('name', customer),
            attributes: {
              comment: [R.prop('comment', customer)]
            }
          });
        } catch (err) {
          logger.error(`Could not add group ${customer.name}: ${err.message}`);
          continue;
        }
      } else {
        logger.error(`Could not update group ${customer.name}: ${err.message}`);
      }
    }

    // Add customer users to group
    const customerUserRecords = await mQuery(
      sqlClientPool,
      'SELECT u.email FROM customer_user cu INNER JOIN user u on cu.usid = u.id WHERE cu.cid = :cid',
      {
        cid: customer.id
      }
    );

    for (const customerUser of customerUserRecords) {
      try {
        const user = await UserModel.loadUserByUsername(customerUser.email);
        await GroupModel.addUserToGroup(user, keycloakGroup, 'owner');
      } catch (err) {
        logger.error(
          `Could not add user (${customerUser.email}) to group (${keycloakGroup.name}): ${err.message}`
        );
      }
    }

    // Add customer projects to group
    const customerProjectRecords = await mQuery(
      sqlClientPool,
      'SELECT id, name FROM project WHERE customer = :cid',
      {
        cid: customer.id
      }
    );

    for (const customerProject of customerProjectRecords) {
      try {
        await GroupModel.addProjectToGroup(customerProject.id, keycloakGroup);
      } catch (err) {
        logger.error(
          `Could not add project (${customerProject.name}) to group (${keycloakGroup.name}): ${err.message}`
        );
      }
    }
  }

  logger.info('Migration completed');
})();
