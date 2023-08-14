import * as R from 'ramda';
import redis, { ClientOpts } from 'redis';
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
  group?: string;
  users?: number[];
}

const hashKey = ({ resource, project, group, scope }: IUserResourceScope) =>
  `${resource}:${project ? `${project}:` : ''}${
    group ? `${group}:` : ''
  }${scope}`;

export const getRedisCache = async (resourceScope: IUserResourceScope): Promise<string> => {
  const redisHash = await hgetall(`cache:authz:${resourceScope.currentUserId}`);
  const key = hashKey(resourceScope);

  return R.prop(key, redisHash);
};

export const saveRedisCache = async (
  resourceScope: IUserResourceScope,
  value: string
) => {
  const key = hashKey(resourceScope);
  const timeout = getConfigFromEnv('CACHE_PERMISSION_TTL', '500');
  redisClient.multi()
  .hset(
    `cache:authz:${resourceScope.currentUserId}`,
    key,
    value
  )
  .expire(`cache:authz:${resourceScope.currentUserId}`, parseInt(timeout, 10))
  .exec();
};

export const getRedisKeycloakCache = async (key: string) => {
  const redisHash = await hgetall(`cache:keycloak`);

  return R.prop(key, redisHash);
};

export const saveRedisKeycloakCache = async (
  key: string,
  value: number | string
) => {
  await redisClient.hmset(
    `cache:keycloak`,
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

export default {
  getRedisCache,
  saveRedisCache,
  getRedisKeycloakCache,
  saveRedisKeycloakCache,
  deleteRedisUserCache,
  getProjectGroupsCache,
  saveProjectGroupsCache
};
