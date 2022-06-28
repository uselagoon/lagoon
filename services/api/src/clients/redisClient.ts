// @ts-ignore
import * as R from 'ramda';
// @ts-ignore
import redis, { ClientOpts } from 'redis';
// @ts-ignore
import { promisify } from 'util';
import { toNumber } from '../util/func';
import { getConfigFromEnv, envHasConfig } from '../util/config';

export const config: {
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
  enable_offline_queue: false
});

redisClient.on('error', function(error) {
  // @ts-ignore
  console.error(error);
});

const hgetall = promisify(redisClient.hgetall).bind(redisClient);
const smembers = promisify(redisClient.smembers).bind(redisClient);
const sadd = promisify(redisClient.sadd).bind(redisClient);
const del = promisify(redisClient.del).bind(redisClient);

interface IUserResourceScope {
  resource: string;
  scope: string;
  currentUserId: string;
  project?: number;
  organization?: number;
  group?: string;
  users?: number[];
}

const hashKey = ({ resource, project, organization, group, scope }: IUserResourceScope) =>
  `${resource}:
  ${project ? `${project}:` : ''}
  ${group ? `${group}:` : ''}
  ${organization ? `${organization}:` : ''}
  ${scope}`;

export const getRedisCache = async (resourceScope: IUserResourceScope) => {
  const redisHash = await hgetall(`cache:authz:${resourceScope.currentUserId}`);
  const key = hashKey(resourceScope);

  return R.prop(key, redisHash);
};

export const saveRedisCache = async (
  resourceScope: IUserResourceScope,
  value: number | string
) => {
  const key = hashKey(resourceScope);
  await redisClient.hmset(
    `cache:authz:${resourceScope.currentUserId}`,
    key,
    value
  );
};

export const deleteRedisUserCache = userId => del(`cache:authz:${userId}`);

export const getProjectGroupsCache = async projectId =>
  smembers(`project-groups:${projectId}`);
export const saveProjectGroupsCache = async (projectId, groupIds) =>
  sadd(`project-groups:${projectId}`, groupIds);
export const deleteProjectGroupsCache = async projectId =>
  del(`project-groups:${projectId}`);

export const getOrganizationGroupsCache = async organizationId =>
  smembers(`organization-groups:${organizationId}`);
export const saveOrganizationGroupsCache = async (organizationId, groupIds) =>
  sadd(`organization-groups:${organizationId}`, groupIds);
export const deleteOrganizationGroupsCache = async (organizationId, groupIds) =>
  del(`organization-groups:${organizationId}`);

export const getUsersOrganizationCache = async organizationId =>
  smembers(`organization-users:${organizationId}`);
export const saveUsersOrganizationCache = async (organizationId, userIds) =>
  sadd(`organization-users:${organizationId}`, userIds);
export const deleteUsersOrganizationCache = async (organizationId, userIds) =>
  del(`organization-users:${organizationId}`);

export default {
  getRedisCache,
  saveRedisCache,
  deleteRedisUserCache,
  getProjectGroupsCache,
  saveProjectGroupsCache,
  getOrganizationGroupsCache,
  saveOrganizationGroupsCache,
  deleteOrganizationGroupsCache,
  getUsersOrganizationCache,
  saveUsersOrganizationCache,
  deleteUsersOrganizationCache
};
