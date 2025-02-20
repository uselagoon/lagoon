import * as R from 'ramda';
import * as gitlabApi from '@lagoon/commons/dist/gitlab/api';
import { addUser, updateUser } from '@lagoon/commons/dist/api';
import { logger } from '@lagoon/commons/dist/logs/local-logger';

const usernameExistsRegex = /Username.*?exists/;

(async () => {
  const allUsers = await gitlabApi.getAllUsers();

  logger.info(`Syncing ${allUsers.length} users`);

  for (const user of allUsers) {
    logger.debug(`Processing ${user.email}`);

    let firstName = user.name,
      lastName;
    if (user.name.includes(' ')) {
      const nameParts = user.name.split(' ');
      firstName = R.head(nameParts) as string;
      lastName = R.tail(nameParts).join(' ');
    }

    try {
      await addUser(
        user.email,
        firstName,
        lastName,
        null,
        user.id,
      );
    } catch (err) {
      if (!R.test(usernameExistsRegex, err.message)) {
        logger.error(`Could not sync (add) gitlab user ${user.email} id ${user.id}: ${err.message}`);
      } else {
        try {
          await updateUser(
            user.email,
            {
              email: user.email,
              firstName,
              lastName,
              gitlabId: user.id,
            }
          );
        } catch (err) {
          logger.error(`Could not sync (update) gitlab user ${user.email} id ${user.id}: ${err.message}`);
        }
      }
    }
  }

  logger.info('Sync completed');
})()
