import * as R from 'ramda';
import * as projectHelpers from '../resources/project/helpers';
import { logger } from '@lagoon/commons/src/local-logging';
import { getSqlClient } from '../clients/sqlClient';
import { Group } from '../models/group';
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
  const tokenRaw = new Buffer(
    keycloakAdminClient.accessToken.split('.')[1],
    'base64',
  );
  const token = JSON.parse(tokenRaw.toString());
  const date = new Date();
  const now = Math.floor(date.getTime() / 1000);

  if (token.exp <= now) {
    logger.debug('Refreshing keycloak token');
    keycloakAdminClient.setConfig({ realmName: 'master' });
    await keycloakAdminClient.auth(keycloakAuth);
    keycloakAdminClient.setConfig({ realmName: 'lagoon' });
  }
};

interface IGroup {
  name: string;
  id?: string;
  type?: string;
  currency?: string;
  path?: string;
  groups?: Group[];
  attributes?: object;
}

(async () => {
  keycloakAdminClient.setConfig({ realmName: 'master' });
  await keycloakAdminClient.auth(keycloakAuth);
  keycloakAdminClient.setConfig({ realmName: 'lagoon' });

  const sqlClient = getSqlClient();
  const GroupModel = Group();

  // GET ALL GROUPS
  const groups = await GroupModel.loadAllGroups();

  // FILTER OUT ONLY BILLING GROUPS

  const groupFilter: (IGroup) => Boolean = group =>
    R.find(R.pathEq(['attributes', 'type'], 'billing'), group) ? true : false;
  const billingGroups = groups.filter(groupFilter);

  // GET ALL PROJECT IDS FOR ALL PROJECTS IN BILLING GROUPS
  const allProjPids = await Promise.all(
    billingGroups.map(group =>
      GroupModel.getProjectsFromGroupAndSubgroups(group),
    ),
  );
  const reducerFn = (acc, arr) => [...acc, ...arr];
  const pids = allProjPids.reduce(reducerFn, []);

  // SQL QUERY FOR ALL PROJECTS NOT IN ID
  const projects = await projectHelpers(sqlClient).getAllProjectsNotIn(pids);
  console.table(projects);
  process.exit();
})();
