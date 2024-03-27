import * as R from 'ramda';
import * as bitbucketApi from '@lagoon/commons/dist/bitbucketApi';
import {
  addUserToGroup,
  removeUserFromGroup,
  getGroupMembersByGroupName,
  getProjectsByGroupName,
  addUser as apiAddUser
} from '@lagoon/commons/dist/api';
import { logger } from '@lagoon/commons/dist/logs/local-logger';
import redis, { ClientOpts } from 'redis';
import { promisify } from 'util';
import { toNumber } from '../util/func';
import { getConfigFromEnv, envHasConfig } from '../util/config';
var crypto = require('crypto');



// The lagoon group that has all of the projects needing to be synced
const LAGOON_SYNC_GROUP = R.propOr(
  'bitbucket-sync',
  'BITBUCKET_SYNC_LAGOON_GROUP',
  process.env
);

const LIMIT_SYNCING_PROJECTS = parseInt(R.propOr(
  '10',
  'LIMIT_SYNCING_PROJECTS',
  process.env
));

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
    await apiAddUser(email);
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



const syncUsersForProjects = async (redis, projects) => {
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
          const lagoonProjectGroupCacheName = `bbsynccache-${lagoonProjectGroup}`;

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


          try {
            const permissions = await bitbucketApi.getRepoUsers(
              bbProject,
              bbRepo
            );

            // Users w/o an email address were deleted/deactivated, but somehow
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

          let userPermissionCacheHash = userPermissionsToCacheHash(userPermissions);
          let cachedUserPermissionCacheHash = await redis.get(lagoonProjectGroupCacheName);
          if(cachedUserPermissionCacheHash == userPermissionCacheHash) {
            logger.warn(`Cache entry found for ${lagoonProjectGroupCacheName} - skipping`);
            return;
          }
          logger.info(`Didnt match ${lagoonProjectGroupCacheName}'s hash ${cachedUserPermissionCacheHash} with ${userPermissionCacheHash} - caching for 24 hours`);
          await redis.set(lagoonProjectGroupCacheName, userPermissionCacheHash, 'EX', 60 * 60 * 24);
          logger.info(`cache hash: ${userPermissionCacheHash} for ${lagoonProjectGroupCacheName} added`);
          let lagoonUsersInGroupTotal = await getLagoonUsersForGroup(
            lagoonProjectGroup
          );

          let lagoonUsersInGroup = getUsersEmails(lagoonUsersInGroupTotal)


          // Sync user/permissions from bitbucket to lagoon
          for (const userPermission of userPermissions) {
            const bbUser = userPermission.user as BitbucketUser;
            const bbPerm = userPermission.permission;

            try {
              const email = bbUser.emailAddress.toLowerCase();

              const userExistsInGroupAlready = R.contains(
                email,
                lagoonUsersInGroup
              );

              let userShouldBeAdded = !R.contains(email, existingUsers) && !userExistsInGroupAlready;

              if (userShouldBeAdded) {
                const userAddedOrExists = await addUser(email);
                if (!userAddedOrExists) {
                  // Errors for this case are logged in addUser
                  continue;
                }

                existingUsers.push(email);
              }

              //Now we check if we need to change this users' permissions
              if(getUsersCurrentPermission(lagoonUsersInGroupTotal, email) != BitbucketPermsToLagoonPerms[bbPerm]) {
                await addUserToGroup(
                  email,
                  lagoonProjectGroup,
                  BitbucketPermsToLagoonPerms[bbPerm]
                );
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
            // @ts-ignore
          )(userPermissions) as [string];

          //Refresh users in group for difference calculation
          lagoonUsersInGroupTotal = await getLagoonUsersForGroup(
            lagoonProjectGroup
          );
          lagoonUsersInGroup = getUsersEmails(lagoonUsersInGroupTotal)

          // Remove users from lagoon project that are removed in bitbucket repo
          const deleteUsers = R.difference(lagoonUsersInGroup, bitbucketUsers);

          for (const user of deleteUsers) {
            try {
              await removeUserFromGroup(user, lagoonProjectGroup);
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

function userPermissionsToCacheHash(userPermissions: any[]) {
  let sortfunc = R.sortBy(R.compose(R.toLower, R.prop('emailAddress')));
  let userPermissionCacheData = sortfunc(userPermissions.map((e) => { return { emailAddress: e.user.emailAddress, permission: e.permission }; }));
  let userPermissionCache = crypto.createHash('md5').update(JSON.stringify(userPermissionCacheData)).digest('hex');
  return userPermissionCache;
}

function getUsersEmails(lagoonUsers) {
  // @ts-ignore
  return R.pipe(R.pluck('user'), R.pluck('email'), R.map(R.toLower))(lagoonUsers) as [string]
}

function getUsersCurrentPermission(lagoonUsers, email) {
  for(let i = 0; i < lagoonUsers.length; i++) {
    if(R.toLower(lagoonUsers[i].user.email) == R.toLower(email)) {
      return lagoonUsers[i].role;
    }
  }
  return false;
}

async function getLagoonUsersForGroup(lagoonProjectGroup: string) {
  const currentMembersQuery = await getGroupMembersByGroupName(lagoonProjectGroup);
  const lagoonUsers = R.pipe(R.pathOr([], ['groupByName','members']))(currentMembersQuery);
  return lagoonUsers;
}

const getRedisClient = () => {
  const config: {
    hostname: string;
    port: number;
    pass?: string;
  } = {
    hostname: getConfigFromEnv('REDIS_HOST', 'api-redis'),
    port: toNumber(getConfigFromEnv('REDIS_PORT', '6379')),
    pass: envHasConfig('REDIS_PASSWORD')
      ? getConfigFromEnv('REDIS_PASSWORD')
      : undefined
  };

  const redisClient = redis.createClient({
    host: config.hostname,
    port: config.port,
    password: config.pass,
    enable_offline_queue: true
  });

  redisClient.on('error', function(error) {
    console.error(error);
  });

  const retRedis = {
    redisClient: redisClient,
    get: promisify(redisClient.get).bind(redisClient),
    set: promisify(redisClient.set).bind(redisClient),
  }


  return retRedis;
}



(async () => {
  const redisObj = getRedisClient();
  // @ts-ignore
  redisObj.redisClient.on("ready", async function() {
      // Get all bitbucket related lagoon projects
      const groupQuery = await getProjectsByGroupName(LAGOON_SYNC_GROUP);
      const projects = R.pathOr([], ['groupByName', 'projects'], groupQuery) as [
        object
      ];

      const syncResponse = await syncUsersForProjects(redisObj, projects);
      logger.info('Sync completed');
      // @ts-ignore
      redisObj.redisClient.quit();
    });
})();
