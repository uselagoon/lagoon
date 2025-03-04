import redis from 'redis';
import { promisify } from 'util';
import { toNumber } from '../util/func';
import { getConfigFromEnv, envHasConfig } from '../util/config';

export class RedisCacheLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RedisCacheLoadError';
  }
}

export class RedisCacheSaveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RedisCacheSaveError';
  }
}

export const config: {
  hostname: string;
  port: number;
  pass?: string;
} = {
  hostname: getConfigFromEnv('REDIS_HOST', 'api-redis'),
  port: toNumber(getConfigFromEnv('REDIS_PORT', '6379')),
  pass: envHasConfig('REDIS_PASSWORD')
    ? getConfigFromEnv('REDIS_PASSWORD')
    : undefined,
};

export const redisClient = redis.createClient({
  host: config.hostname,
  port: config.port,
  password: config.pass,
  enable_offline_queue: false,
});

redisClient.on('error', function (error) {
  console.error(error);
});

export const get = promisify(redisClient.get).bind(redisClient);
export const del = promisify(redisClient.del).bind(redisClient);
