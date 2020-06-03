import * as R from 'ramda';
import { logger } from '@lagoon/commons/dist/local-logging';
import { getKeycloakAdminClient } from '../../clients/keycloak-admin';
import { getSqlClient } from '../../clients/sqlClient';
import { query, prepare } from '../../util/db';
import { User, UserNotFoundError } from '../../models/user';

(async () => {
  const keycloakAdminClient = await getKeycloakAdminClient();

  const sqlClient = getSqlClient();
  const UserModel = User({ keycloakAdminClient });

  const userRecords = await query(sqlClient, 'SELECT * FROM `user`');

  for (const user of userRecords) {
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
