// @flow

const graphql = require('express-graphql');
const schema = require('../schema').schema;

const graphqlRoute = graphql({
  graphiql: process.env.NODE_ENV === 'development',
  pretty: true,
  schema,
});

module.exports = [graphqlRoute];
