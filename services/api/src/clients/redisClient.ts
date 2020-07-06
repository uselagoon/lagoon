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

let redisHMGetAllAsync = promisify(redisClient.hgetall).bind(redisClient);
let redisDelAsync = promisify(redisClient.del).bind(redisClient);

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

export const getRedisCache = async (
  resourceScope: IUserResourceScope
) => {
  const redisHash = await redisHMGetAllAsync(
    `cache:authz:${resourceScope.currentUserId}`
  );
  const key = hashKey(resourceScope);

  return redisHash[key];
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

export const deleteRedisUserCache = userId =>
  redisDelAsync(`cache:authz:${userId}`);

export default {
  getRedisCache,
  saveRedisCache,
  deleteRedisUserCache
};
