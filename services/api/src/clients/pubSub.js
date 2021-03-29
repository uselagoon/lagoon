const R = require('ramda');
const { withFilter } = require('graphql-subscriptions');
const { AmqpPubSub } = require('graphql-rabbitmq-subscriptions');
const { ForbiddenError } = require('apollo-server-express');
const logger = require('../logger');
const { query } = require('../util/db');
const { Sql: environmentSql } = require('../resources/environment/sql');

const rabbitmqHost = process.env.RABBITMQ_HOST || 'broker';
const rabbitmqUsername = process.env.RABBITMQ_USERNAME || 'guest';
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD || 'guest';

const pubSub = new AmqpPubSub({
  config: `amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}`,
  logger: logger,
});

const createEnvironmentFilteredSubscriber = (events) => ({
  // Allow publish functions to pass data without knowledge of query schema.
  resolve: (payload) => payload,
  subscribe: async (rootValue, args, context, info) => {
    const { environment } = args;
    const {
      sqlClient,
      hasPermission,
    } = context;

    const rows = await query(
      sqlClient,
      environmentSql.selectEnvironmentById(environment),
    );
    sqlClient.end();
    const project = R.path([0, 'project'], rows);

    try {
      await hasPermission('environment', 'view', {
        project,
      });
    } catch (err) {
      throw new ForbiddenError(err.message);
    }

    const filtered = withFilter(
      () => pubSub.asyncIterator(events),
      (payload, variables) =>
        payload.environment === String(variables.environment),
    );

    return filtered(rootValue, args, context, info);
  },
});

module.exports = {
  pubSub,
  createEnvironmentFilteredSubscriber,
};
