import { path } from 'ramda';
import { withFilter } from 'graphql-subscriptions';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { ForbiddenError } from 'apollo-server-express';
import { query } from '../util/db';
import { Sql as environmentSql } from '../resources/environment/sql';
import { Sql as projectSql } from '../resources/project/sql';
import { Sql as orgSql } from '../resources/organization/sql';
import { Helpers as projectHelpers } from '../resources/project/helpers';
import { ResolverFn } from '../resources';
import { config } from './redisClient';

export const EVENTS = {
  DEPLOYMENT: 'api.subscription.deployment',
  BACKUP: 'api.subscription.backup',
  TASK: 'api.subscription.task',
  PROJECTCLONE: 'api.subscription.projectclone',
  ORGPROJECT: 'api.subscription.orgproject'
};

const endpoint = `redis://:${config.pass}@${config.hostname}:${config.port}`;

export const pubSub = new RedisPubSub({
  connection: endpoint
});

const createEnvironmentSubscribe = (events): ResolverFn => async (
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
        if (!payload || payload.environment === undefined) {
          return false;
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

const createProjectSubscribe = (events): ResolverFn => async (
  rootValue,
  args,
  context,
  info
) => {
  const filtered = withFilter(
    () => pubSub.asyncIterator(events),

    async (payload, variables, ctx) => {
      const { project: projectName } = variables;
      const { sqlClientPool, hasPermission, adminScopes } = ctx;

      try {
        const rows = await query(
          sqlClientPool,
          projectSql.selectProjectByName(projectName),
        );

        const p = path([0, 'id'], rows);
        if (!p) {
          throw new ForbiddenError('Project not found.');
        }

        await projectHelpers(sqlClientPool).checkOrgProjectViewPermission(hasPermission, p, adminScopes)
        if (!payload || payload.destinationProject === undefined) {
          return false;
        }

        return payload.destinationProject === p;
      } catch (err) {
        console.error(`Subscription permission check failed: ${err.message}`);
        return false;
      }
    },
  );

  return filtered(rootValue, args, context, info);
};

const createOrganizationSubscribe = (events): ResolverFn => async (
  rootValue,
  args,
  context,
  info
) => {
  const filtered = withFilter(
    () => pubSub.asyncIterator(events),

    async (payload, variables, ctx) => {
      const { organization: orgName } = variables;
      const { sqlClientPool, hasPermission, adminScopes } = ctx;

      try {
        const rows = await query(
          sqlClientPool,
          orgSql.selectOrganizationByName(orgName),
        );

        const o = path([0, 'id'], rows);
        if (!o) {
          throw new ForbiddenError('Organization not found.');
        }

        if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
          // This will throw ForbiddenError if denied, killing the subscription immediately
          await hasPermission('organization', 'view', {
            organization: o,
          });
        }
        if (!payload) {
          return false;
        }

        return true;
      } catch (err) {
        console.error(`Subscription permission check failed: ${err.message}`);
        return false;
      }
    },
  );

  return filtered(rootValue, args, context, info);
};

export const createEnvironmentFilteredSubscriber = events => ({
  resolve: payload => payload,
  subscribe: createEnvironmentSubscribe(events)
});

export const createProjectFilteredSubscriber = events => ({
  resolve: payload => payload,
  subscribe: createProjectSubscribe(events)
});

export const createOrganizationFilteredSubscriber = events => ({
  resolve: payload => payload,
  subscribe: createOrganizationSubscribe(events)
});
