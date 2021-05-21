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

const LIMIT_SYNCING_PROJECTS = 10;

const syncUsersForProjects = async projects => {
  // Keep track of users we know exist to avoid API calls
  let existingUsers = [];

  logger.info(`Syncing users for ${projects.length} project(s)`);
  while (projects.length > 0) {
    let limitedProjects = projects.slice(0, LIMIT_SYNCING_PROJECTS);
    projects = projects.slice(LIMIT_SYNCING_PROJECTS);
    await Promise.all(
      limitedProjects.map(async project => {
        try {
          const gitUrl = R.prop('gitUrl', project) as string;
          const projectName = R.prop('name', project) as string;
          const lagoonProjectGroup = `project-${projectName}`;

          const repo = await getBitbucketRepo(gitUrl, projectName);
          if (!repo) {
            logger.warn(
              `No bitbucket repo found for project "${projectName}", gitUrl "${gitUrl}"`
            );
            return;
          }

          const bbProject = R.path(['project', 'key'], repo);
          const bbRepo = R.prop('slug', repo);
          logger.debug(
            `Processing project "${projectName}", bitbucket "${bbRepo}"`
          );

          let userPermissions = [];

          const lagoonUsersInGroup = await getLagoonUsersForGroup(
            lagoonProjectGroup
          );

          try {
            const permissions = await bitbucketApi.getRepoUsers(
              bbProject,
              bbRepo
            );

            // Useres w/o an email address were deleted/deactivated, but somehow
            // still returned in the API
            // @ts-ignore
            userPermissions = R.filter(
              R.propSatisfies(R.has('emailAddress'), 'user'),
              permissions
            );
          } catch (e) {
            logger.warn(
              `Could not load users for repo ${R.prop('slug', repo)}: ${
                e.message
              }`
            );
            return;
          }

          // Sync user/permissions from bitbucket to lagoon
          for (const userPermission of userPermissions) {
            const bbUser = userPermission.user as BitbucketUser;
            const bbPerm = userPermission.permission;

            try {
              const email = bbUser.emailAddress.toLowerCase();

              const userExistsInGroupAlready = !R.contains(
                email,
                lagoonUsersInGroup
              );

              if (
                !R.contains(email, existingUsers) &&
                !userExistsInGroupAlready
              ) {
                const userAddedOrExists = await addUser(email);
                if (!userAddedOrExists) {
                  // Errors for this case are logged in addUser
                  continue;
                }

                existingUsers.push(email);
              }
              if (!userExistsInGroupAlready) {
                await api.addUserToGroup(
                  email,
                  lagoonProjectGroup,
                  BitbucketPermsToLagoonPerms[bbPerm]
                );
                lagoonUsersInGroup.push(email); //Adding the user here, we don't need to re-call the group membership
                // to calculate who we need to remove from the Lagoon group
              }
            } catch (err) {
              logger.error(
                `Could not add user (${bbUser.name}) to group (${lagoonProjectGroup}): ${err.message}`
              );
            }
          }

          // Get current bitbucket uers
          const bitbucketUsers = R.pipe(
            // @ts-ignore
            R.pluck('user'),
            // @ts-ignore
            R.pluck('emailAddress'),
            // @ts-ignore
            R.map(R.toLower)
          )(userPermissions) as [string];

          // Remove users from lagoon project that are removed in bitbucket repo
          const deleteUsers = R.difference(lagoonUsersInGroup, bitbucketUsers);

          for (const user of deleteUsers) {
            try {
              await api.removeUserFromGroup(user, lagoonProjectGroup);
            } catch (err) {
              logger.error(
                `Could not remove user (${user}) from group (${lagoonProjectGroup}): ${err.message}`
              );
            }
          }
        } catch (err) {
          logger.error(
            `Unable to sync group (${project.name}): ${err.message}`
          );
        }
      })
    );
  }
};

(async () => {
  // Get all bitbucket related lagoon projects
  const groupQuery = await api.getProjectsByGroupName(LAGOON_SYNC_GROUP);
  const projects = R.pathOr([], ['groupByName', 'projects'], groupQuery) as [
    object
  ];
  const syncResponse = await syncUsersForProjects(projects);

  logger.info('Sync completed');
})();

async function getLagoonUsersForGroup(lagoonProjectGroup: string) {
  const currentMembersQuery = await api.getGroupMembersByGroupName(lagoonProjectGroup);
  const lagoonUsers = R.pipe(
    R.pathOr([], ['groupByName', 'members']),
    // @ts-ignore
    R.pluck('user'),
    // @ts-ignore
    R.pluck('email'),
    // @ts-ignore
    R.map(R.toLower)
  )(currentMembersQuery) as [string];
  return lagoonUsers;
}

