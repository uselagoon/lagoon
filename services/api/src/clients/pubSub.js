// @flow

const R = require('ramda');
const { PubSub, withFilter } = require('graphql-subscriptions');
const { AmqpPubSub } = require('graphql-rabbitmq-subscriptions');
const { ForbiddenError } = require('apollo-server-express');
const logger = require('../logger');
const sqlClient = require('./sqlClient');
const { query } = require('../util/db');
const environmentSql = require('../resources/environment/sql');

const rabbitmqHost = process.env.RABBITMQ_HOST || 'rabbitmq';
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
