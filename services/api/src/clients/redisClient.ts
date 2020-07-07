import * as R from 'ramda';
import redis, { ClientOpts } from 'redis';
import { promisify } from 'util';

const { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } = process.env;

let clientOptions: ClientOpts = {
  host: REDIS_HOST || 'api-redis',
  port: parseInt(REDIS_PORT, 10) || 6379,
  enable_offline_queue: false
};

if (typeof REDIS_PASSWORD !== undefined) {
  clientOptions.password = REDIS_PASSWORD;
}

const redisClient = redis.createClient(clientOptions);

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

export const getRedisCache = async (resourceScope: IUserResourceScope) => {
  const redisHash = await hgetall(
    `cache:authz:${resourceScope.currentUserId}`
  );
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

export default {
  getRedisCache,
  saveRedisCache,
  deleteRedisUserCache,
  getProjectGroupsCache,
  saveProjectGroupsCache
};
