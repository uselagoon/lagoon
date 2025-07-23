import { path } from 'ramda';
import { withFilter } from 'graphql-subscriptions';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { ForbiddenError } from 'apollo-server-express';
import { query } from '../util/db';
import { Sql as environmentSql } from '../resources/environment/sql';
import { ResolverFn } from '../resources';
import { config } from './redisClient';

export const EVENTS = {
  DEPLOYMENT: 'api.subscription.deployment',
  BACKUP: 'api.subscription.backup',
  TASK: 'api.subscription.task'
};

const endpoint = `redis://:${config.pass}@${config.hostname}:${config.port}`;

export const pubSub = new RedisPubSub({
  connection: endpoint
});

const createSubscribe = (events): ResolverFn => async (
  rootValue,
  args,
  context,
  info
) => {
  const filtered = withFilter(
    () => pubSub.asyncIterator(events),

    async (payload, variables, ctx) => {
      const { environment: environmentId } = variables;
      const { sqlClientPool, hasPermission, adminScopes } = ctx;

      try {
        const rows = await query(
          sqlClientPool,
          environmentSql.selectEnvironmentById(environmentId),
        );

        const project = path([0, 'project'], rows);
        if (!project) {
          return false;
        }

        // if the user is not a platform owner or viewer, then perform normal permission check
        if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
          await hasPermission('environment', 'view', {
            project
          });
        }

        return payload.environment === environmentId;
      } catch (err) {
        console.error(`Subscription permission check failed: ${err.message}`);
        return false;
      }
    },
  );

  return filtered(rootValue, args, context, info);
};

export const createEnvironmentFilteredSubscriber = events => {
  return createSubscribe(events)
};
