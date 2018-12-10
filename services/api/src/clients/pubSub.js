// @flow

const R = require('ramda');
const { PubSub, withFilter } = require('graphql-subscriptions');
const { ForbiddenError } = require('apollo-server-express');
const sqlClient = require('./sqlClient');
const { query } = require('../util/db');
const environmentSql = require('../resources/environment/sql');

const pubSub = new PubSub();

const createEnvironmentFilteredSubscriber = (events: string[]) => {
  return {
    // Allow publish functions to pass data without knowledge of query schema.
    resolve: (payload: Object) => payload,
    subscribe: async (rootValue: any, args: any, context: any, info: any) => {
      const { environment } = args;
      const {
        credentials: {
          role,
          permissions: { projects },
        },
      } = context;

      const rows = await query(sqlClient, environmentSql.selectEnvironmentById(environment));
      const project = R.path([0, 'project'], rows);

      if (role !== 'admin' && !R.contains(String(project), projects)) {
        throw new ForbiddenError(`No access to project ${project}.`);
      }

      const filtered = withFilter(
        () => pubSub.asyncIterator(events),
        (
          payload,
          variables,
        ) => payload.environment === String(variables.environment),
      );

      return filtered(rootValue, args, context, info);
    },
  };
};

module.exports = {
  pubSub,
  createEnvironmentFilteredSubscriber,
};
