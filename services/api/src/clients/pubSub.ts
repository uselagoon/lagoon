import { path } from 'ramda';
import { withFilter } from 'graphql-subscriptions';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { ForbiddenError } from 'apollo-server-express';
import { logger } from '../loggers/logger';
import { query } from '../util/db';
import { Sql as environmentSql } from '../resources/environment/sql';
import { ResolverFn } from '../resources';
import { config } from './redisClient';
import Redis from 'ioredis';

export const EVENTS = {
  DEPLOYMENT: 'api.subscription.deployment',
  BACKUP: 'api.subscription.backup',
  TASK: 'api.subscription.task'
};

const options = {
  host: config.hostname,
  port: config.port,
  password: config.pass,
  retryStrategy: times => {
    // reconnect after
    return Math.min(times * 50, 2000);
  }
};

export const pubSub = new RedisPubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options),
  connectionListener: (err) => {
    if (err) {
        logger.info("Pubsub: error connecting to redis", err);
    } else {
      logger.info("Pubsub: Successfuly connected to redis");
    }
},
});

const createSubscribe = (events): ResolverFn => async (
  rootValue,
  args,
  context,
  info
) => {
  const { environment } = args;
  const { sqlClientPool, hasPermission, adminScopes } = context;

  const rows = await query(
    sqlClientPool,
    environmentSql.selectEnvironmentById(environment)
  );

  const project = path([0, 'project'], rows);

  try {
    // if the user is not a platform owner or viewer, then perform normal permission check
    if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
      await hasPermission('environment', 'view', {
        project
      });
    }
  } catch (err) {
    throw new ForbiddenError(err.message);
  }

  const filtered = withFilter(
    () => pubSub.asyncIterator(events),
    (payload, variables) => payload.environment === variables.environment
  );

  return filtered(rootValue, args, context, info);
};

export const createEnvironmentFilteredSubscriber = events => ({
  // Allow publish functions to pass data without knowledge of query schema.
  resolve: payload => payload,
  subscribe: createSubscribe(events)
});

