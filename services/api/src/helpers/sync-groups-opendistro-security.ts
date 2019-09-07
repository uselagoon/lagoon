import * as R from 'ramda';
import { logger } from '@lagoon/commons/src/local-logging';
import { getSqlClient } from '../clients/sqlClient';
import { Group } from '../models/group';
import { OpendistroSecurityOperations } from '../resources/group/opendistroSecurity';
import { keycloakAdminClient } from '../clients/keycloakClient';


const keycloakAuth = {
  username: 'admin',
  password: R.pathOr(
    '<password not set>',
    ['env', 'KEYCLOAK_ADMIN_PASSWORD'],
    process,
  ) as string,
  grantType: 'password',
  clientId: 'admin-cli',
};

const refreshToken = async keycloakAdminClient => {
  const tokenRaw = new Buffer(keycloakAdminClient.accessToken.split('.')[1], 'base64');
  const token = JSON.parse(tokenRaw.toString());
  const date = new Date();
  const now = Math.floor(date.getTime() / 1000);

  if (token.exp <= now) {
    logger.debug('Refreshing keycloak token');
    keycloakAdminClient.setConfig({ realmName: 'master' });
    await keycloakAdminClient.auth(keycloakAuth);
    keycloakAdminClient.setConfig({ realmName: 'lagoon' });
  }
}

(async () => {

  keycloakAdminClient.setConfig({ realmName: 'master' });
  await keycloakAdminClient.auth(keycloakAuth);
  keycloakAdminClient.setConfig({ realmName: 'lagoon' });

  const sqlClient = getSqlClient();
  const GroupModel = Group();

  const groups = await GroupModel.loadAllGroups();

  for (const group of groups) {
    await refreshToken(keycloakAdminClient);
    logger.debug(`Processing ${group.name}`);
    const projectIdsArray = await GroupModel.getProjectsFromGroupAndSubgroups(group)
    const projectIds = R.join(',')(projectIdsArray)
    await OpendistroSecurityOperations(sqlClient, GroupModel).syncGroup(group.name, projectIds);
  }

  logger.info('Migration completed');

  sqlClient.destroy();
})();
