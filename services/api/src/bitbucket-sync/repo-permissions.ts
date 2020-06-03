import * as R from 'ramda';
import * as bitbucketApi from '@lagoon/commons/dist/bitbucketApi';
import * as api from '@lagoon/commons/dist/api';
import { logger } from '@lagoon/commons/dist/local-logging';

// The lagoon group that has all of the projects needing to be synced
const LAGOON_SYNC_GROUP = R.propOr(
  'bitbucket-sync',
  'BITBUCKET_SYNC_LAGOON_GROUP',
  process.env
);

interface BitbucketUser {
  name: string;
  displayName: string;
  emailAddress: string;
  id: number;
}

const usernameExistsRegex = /Username.*?exists/;
const userExistsTest = errorMessage =>
  R.test(usernameExistsRegex, errorMessage);

const BitbucketPermsToLagoonPerms = {
  REPO_READ: 'REPORTER',
  REPO_WRITE: 'DEVELOPER',
  REPO_ADMIN: 'MAINTAINER'
};

// Returns true if user was added or already exists.
// Returns false if adding user failed and no user exists.
const addUser = async (email: string): Promise<boolean> => {
  try {
    await api.addUser(email);
  } catch (err) {
    if (!userExistsTest(err.message)) {
      logger.error(
        `Could not sync (add) bitbucket user ${email}: ${err.message}`
      );
      return false;
    }
  }

  // User was added or already exists
  return true;
}

(async () => {
  // Keep track of users we know exist to avoid API calls
  let existingUsers = [];

  // Get all bitbucket related lagoon projects
  const groupQuery = await api.getProjectsByGroupName(LAGOON_SYNC_GROUP);
  const projects = R.pathOr([], ['groupByName', 'projects'], groupQuery) as [
    object
  ];

  logger.info(`Syncing users for ${projects.length} project(s)`);

  for (const project of projects) {
    const projectName = R.prop('name', project);
    const lagoonProjectGroup = `project-${projectName}`;
    const repo = await bitbucketApi.searchReposByName(projectName);
    if (!repo) {
      logger.warn(`No bitbuket repo found for: ${projectName}`);
      continue;
    }

    const bbProject = R.path(['project', 'key'], repo);
    const bbRepo = R.prop('slug', repo);
    logger.debug(`Processing ${bbRepo}`);

    let userPermissions = [];
    try {
      userPermissions = await bitbucketApi.getRepoUsers(bbProject, bbRepo);
    } catch (e) {
      logger.warn(`Could not load users for repo: ${R.prop('slug', repo)}`);
      continue;
    }

    // Sync user/permissions from bitbucket to lagoon
    for (const userPermission of userPermissions) {
      const bbUser = userPermission.user as BitbucketUser;
      const bbPerm = userPermission.permission;

      const email = bbUser.emailAddress.toLowerCase();

      if (!R.contains(email, existingUsers)) {
        const userAddedOrExists = await addUser(email);
        if (!userAddedOrExists) {
          // Errors for this case are logged in addUser
          continue;
        }

        existingUsers.push(email);
      }

      try {
        await api.addUserToGroup(
          email,
          lagoonProjectGroup,
          BitbucketPermsToLagoonPerms[bbPerm]
        );
      } catch (err) {
        logger.error(
          `Could not add user (${email}) to group (${lagoonProjectGroup}): ${err.message}`
        );
      }
    }

    // Get current lagoon users
    const currentMembersQuery = await api.getGroupMembersByGroupName(lagoonProjectGroup);
    const lagoonUsers = R.pipe(
      R.pathOr([], ['groupByName', 'members']),
      // @ts-ignore
      R.pluck('user'),
      // @ts-ignore
      R.pluck('email'),
    )(currentMembersQuery) as [string];

    // Get current bitbucket uers
    const bitbucketUsers = R.pipe(
      // @ts-ignore
      R.pluck('user'),
      // @ts-ignore
      R.pluck('emailAddress'),
    )(userPermissions) as [string];

    // Remove users from lagoon project that are removed in bitbucket repo
    const deleteUsers = R.difference(lagoonUsers, bitbucketUsers);
    for (const user of deleteUsers) {
      try {
        await api.removeUserFromGroup(user, lagoonProjectGroup);
      } catch (err) {
        logger.error(`Could not remove user (${user}) from group (${lagoonProjectGroup}): ${err.message}`);
      }
    }
  }

  logger.info('Sync completed');
})();
