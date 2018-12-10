// @flow

const { ApolloServer } = require('apollo-server-express');
const logger = require('./logger');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  debug: process.env.NODE_ENV === 'development',
  context: ({ req }) => ({
    credentials: req.credentials,
  }),
  formatError: (error) => {
    logger.warn(error.message);
    return {
      message: error.message,
      locations: error.locations,
      path: error.path,
    };
  },
});

module.exports = apolloServer;
