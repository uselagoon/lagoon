// @flow

import graphql from 'express-graphql';
import schema from '../schema';

const graphqlRoute = graphql({
  graphiql: process.env.NODE_ENV === 'development',
  pretty: true,
  schema,
});

export default [graphqlRoute];
