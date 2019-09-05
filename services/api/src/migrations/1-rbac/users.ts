import * as R from 'ramda';
import { logger } from '@lagoon/commons/src/local-logging';
import { keycloakAdminClient } from '../../clients/keycloakClient';
import { getSqlClient } from '../../clients/sqlClient';
import { query, prepare } from '../../util/db';
import { User, UserNotFoundError } from '../../models/user';

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
  const UserModel = User();

  const userRecords = await query(sqlClient, 'SELECT * FROM `user`');

  for (const user of userRecords) {
    await refreshToken(keycloakAdminClient);
    logger.debug(`Processing ${user.email}`);

    // Add or update user
    let keycloakUser;
    try {
      const existingUser = await UserModel.loadUserByUsername(user.email);
      keycloakUser = await UserModel.updateUser({
        id: existingUser.id,
        email: existingUser.email,
        username: existingUser.username,
        firstName: R.propOr(
          R.prop('firstName', existingUser),
          'firstName',
          user,
        ),
        lastName: R.propOr(R.prop('lastName', existingUser), 'lastName', user),
        comment: R.propOr(R.prop('comment', existingUser), 'comment', user),
        gitlabId: R.propOr(R.prop('gitlabId', existingUser), 'gitlabId', user),
      });
    } catch (err) {
      if (err instanceof UserNotFoundError) {
        try {
          keycloakUser = await UserModel.addUser({
            email: R.prop('email', user),
            username: R.prop('email', user),
            firstName: R.prop('firstName', user),
            lastName: R.prop('lastName', user),
            comment: R.prop('comment', user),
            gitlabId: R.prop('gitlabId', user),
          });
        } catch (err) {
          logger.error(`Could not add user ${user.email}: ${err.message}`);
          continue;
        }
      } else {
        logger.error(`Could not update user ${user.email}: ${err.message}`);
      }
    }

    const updateUserSshKey = prepare(
      sqlClient,
      'UPDATE `user_ssh_key` SET `usid` = :new_usid WHERE `usid` = :old_usid',
    );
    await query(
      sqlClient,
      updateUserSshKey({
        old_usid: user.id,
        new_usid: keycloakUser.id,
      }),
    );
  }

  logger.info('Migration completed');

  sqlClient.destroy();
})();
