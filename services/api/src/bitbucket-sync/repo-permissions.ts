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
  emailAddress?: string;
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

const isNotEmpty = R.complement(R.isEmpty);

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

const getBitbucketRepo = async (gitUrl: string, projectName: string) => {
  // Find the repo based on gitUrl to properly sync polysite permissions
  const repoNameFromGitUrl = R.match(/([^/]+)\.git/, gitUrl);
  if (isNotEmpty(repoNameFromGitUrl)) {
    const repo = await bitbucketApi.searchReposByName(repoNameFromGitUrl[1]);
    if (repo) {
      return repo;
    }
  }

  // Fallback to search based on lagoon project name
  return bitbucketApi.searchReposByName(projectName);
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
    const gitUrl = R.prop('gitUrl', project) as string;
    const projectName = R.prop('name', project) as string;
    const lagoonProjectGroup = `project-${projectName}`;

    const repo = await getBitbucketRepo(gitUrl, projectName);
    if (!repo) {
      logger.warn(`No bitbucket repo found for project "${projectName}", gitUrl "${gitUrl}"`);
      continue;
    }

    const bbProject = R.path(['project', 'key'], repo);
    const bbRepo = R.prop('slug', repo);
    logger.debug(`Processing project "${projectName}", bitbucket "${bbRepo}"`);

    let userPermissions = [];
    try {
      const permissions = await bitbucketApi.getRepoUsers(bbProject, bbRepo);

      // Useres w/o an email address were deleted/deactivated, but somehow
      // still returned in the API
      // @ts-ignore
      userPermissions = R.filter(R.propSatisfies(R.has('emailAddress'), 'user'), permissions);
    } catch (e) {
      logger.warn(`Could not load users for repo ${R.prop('slug', repo)}: ${e.message}`);
      continue;
    }

    // Sync user/permissions from bitbucket to lagoon
    for (const userPermission of userPermissions) {
      const bbUser = userPermission.user as BitbucketUser;
      const bbPerm = userPermission.permission;

      try {
        const email = bbUser.emailAddress.toLowerCase();

        if (!R.contains(email, existingUsers)) {
          const userAddedOrExists = await addUser(email);
          if (!userAddedOrExists) {
            // Errors for this case are logged in addUser
            continue;
          }

          existingUsers.push(email);
        }

        await api.addUserToGroup(
          email,
          lagoonProjectGroup,
          BitbucketPermsToLagoonPerms[bbPerm]
        );
      } catch (err) {
        logger.error(
          `Could not add user (${bbUser.name}) to group (${lagoonProjectGroup}): ${err.message}`
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
      // @ts-ignore
      R.map(R.toLower),
      )(currentMembersQuery) as [string];

    // Get current bitbucket uers
    const bitbucketUsers = R.pipe(
      // @ts-ignore
      R.pluck('user'),
      // @ts-ignore
      R.pluck('emailAddress'),
      // @ts-ignore
      R.map(R.toLower),
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
