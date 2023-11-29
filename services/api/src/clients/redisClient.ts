import * as R from 'ramda';
import redis, { ClientOpts } from 'redis';
import { promisify } from 'util';
import { toNumber } from '../util/func';
import { getConfigFromEnv, envHasConfig } from '../util/config';
import Client from "ioredis";
import Redlock from "redlock";

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

export const redisClient = redis.createClient({
  host: config.hostname,
  port: config.port,
  password: config.pass,
  enable_offline_queue: false
});

// implement a redis lock for reading/writing to redis https://github.com/mike-marcacci/node-redlock
const redlockClient = new Client({
  host: config.hostname,
  port: config.port,
  password: config.pass
});

// this is the initial lock extension, 5000 ms should be more than enough for most operations
export const initialLockDuration = envHasConfig('REDIS_LOCK_DURATION') ? toNumber(getConfigFromEnv('REDIS_LOCK_DURATION')) : 5000

// the lock extension is only used if the redis lock needs to retrieve information from keycloak
export const extendLockDuration = envHasConfig('REDIS_LOCK_LOCKEXTENSION') ? toNumber(getConfigFromEnv('REDIS_LOCK_LOCKEXTENSION')) : 180000

export const redlock = new Redlock(
  // You should have one client for each independent redis node
  // or cluster.
  [redlockClient],
  {
    // The expected clock drift; for more details see:
    // http://redis.io/topics/distlock
    driftFactor: 0.01, // multiplied by lock ttl to determine drift time

    // The max number of times Redlock will attempt to lock a resource
    // before erroring.
    retryCount: envHasConfig('REDIS_LOCK_RETRY')
    ? toNumber(getConfigFromEnv('REDIS_LOCK_RETRY'))
    : 20,

    // the time in ms between attempts
    retryDelay: envHasConfig('REDIS_LOCK_RETRYDELAY')
    ? toNumber(getConfigFromEnv('REDIS_LOCK_RETRYDELAY'))
    : 200, // time in ms

    // the max time in ms randomly added to retries
    // to improve performance under high contention
    // see https://www.awsarchitectureblog.com/2015/03/backoff.html
    retryJitter: envHasConfig('REDIS_LOCK_RETRYJITTER')
    ? toNumber(getConfigFromEnv('REDIS_LOCK_RETRYJITTER'))
    : 200, // time in ms

    // The minimum remaining time on a lock before an extension is automatically
    // attempted with the `using` API.
    automaticExtensionThreshold: envHasConfig('REDIS_LOCK_EXTENSION')
    ? toNumber(getConfigFromEnv('REDIS_LOCK_EXTENSION'))
    : 500, // time in ms
  }
);

redisClient.on('error', function(error) {
  console.error(error);
});

export const get = promisify(redisClient.get).bind(redisClient);
const hgetall = promisify(redisClient.hgetall).bind(redisClient);
const smembers = promisify(redisClient.smembers).bind(redisClient);
const sadd = promisify(redisClient.sadd).bind(redisClient);
export const del = promisify(redisClient.del).bind(redisClient);

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
  getRedisKeycloakCache,
  saveRedisKeycloakCache,
  deleteRedisUserCache,
  getProjectGroupsCache,
  saveProjectGroupsCache
};
