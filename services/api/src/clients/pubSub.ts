import { path } from 'ramda';
import { withFilter } from 'graphql-subscriptions';
import { AmqpPubSub } from 'graphql-rabbitmq-subscriptions';
import { ForbiddenError } from 'apollo-server-express';
import { logger } from '../loggers/logger';
import { getConfigFromEnv } from '../util/config';
import { query } from '../util/db';
import { Sql as environmentSql } from '../resources/environment/sql';
import { ResolverFn } from '../resources';

export const EVENTS = {
  DEPLOYMENT: 'api.subscription.deployment',
  BACKUP: 'api.subscription.backup',
  TASK: 'api.subscription.task'
};

export const config = {
  host: getConfigFromEnv('RABBITMQ_HOST', 'broker'),
  user: getConfigFromEnv('RABBITMQ_USERNAME', 'guest'),
  pass: getConfigFromEnv('RABBITMQ_PASSWORD', 'guest'),
  get connectionUrl() {
    return `amqp://${this.user}:${this.pass}@${this.host}`;
  }
};

export const pubSub = new AmqpPubSub({
  config: config.connectionUrl,
  // @ts-ignore
  logger
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
