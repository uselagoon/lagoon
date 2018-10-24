// @flow

const graphql = require('express-graphql');
const { schema } = require('../schema');
const logger = require('../logger');

const graphqlRoute = graphql({
  graphiql: process.env.NODE_ENV === 'development',
  pretty: true,
  schema,
  formatError: (error) => {
    logger.warn(error.message);
    return {
      message: error.message,
      locations: error.locations,
      path: error.path,
    };
  }
  ,
});

module.exports = [graphqlRoute];
