// @flow

const R = require('ramda');
const { withFilter } = require('graphql-subscriptions');
const { AmqpPubSub } = require('graphql-rabbitmq-subscriptions');
const { ForbiddenError } = require('apollo-server-express');
const logger = require('../logger');
const { query } = require('../util/db');
const environmentSql = require('../resources/environment/sql');

const rabbitmqHost = process.env.RABBITMQ_HOST || 'broker';
const rabbitmqUsername = process.env.RABBITMQ_USERNAME || 'guest';
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD || 'guest';

/* eslint-disable class-methods-use-this */
class LoggerConverter {
  child() {
    return {
      debug: logger.debug,
      trace: logger.silly,
      error: logger.error,
    };
  }

  error(...args) {
    return logger.error.apply(args);
  }

  debug(...args) {
    return logger.debug(args);
  }

  trace(...args) {
    return logger.silly(args);
  }
}
/* eslint-enable class-methods-use-this */

const pubSub = new AmqpPubSub({
  config: `amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}`,
  logger: new LoggerConverter(),
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
