import * as R from 'ramda';

import { logger } from '@lagoon/commons/dist/local-logging';
import * as api from '@lagoon/commons/dist/api';

import { getKeycloakAdminClient } from '../clients/keycloak-admin';
import { sqlClientPool } from '../clients/sqlClient';
import { esClient } from '../clients/esClient';
import redisClient from '../clients/redisClient';
import { query } from '../util/db';
import { Group } from '../models/group';
import { User } from '../models/user';



(async () => {
  const keycloakAdminClient = await getKeycloakAdminClient();

  const GroupModel = Group({
    sqlClientPool,
    keycloakAdminClient,
    esClient,
    redisClient
  });
  // const UserModel = User({
  //   sqlClientPool,
  //   keycloakAdminClient,
  //   esClient,
  //   redisClient
  // });

  logger.info('Generating groups');

  for (let i = 0; i <= 2463; i++) {
    try {
      await GroupModel.addGroup({
        name: `test-group-${i}`
      });
    } catch (e) {
      logger.error(e.message);
    }

  }

  logger.info('done');
  process.exit();
})();
