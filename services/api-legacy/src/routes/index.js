import express from 'express';
import graphQL from 'express-graphql';
import schema from '../schema';

const router = new express.Router();

// Add the GraphQL server.
router.use('/graphql', graphQL({
  graphiql: process.env.NODE_ENV === 'development',
  pretty: true,
  schema,
}));

// Load route middlewares into the main router.
import genericRouter from './generic';
router.use('/', genericRouter);

import siteRouter from './site';
router.use('/site', siteRouter);

import siteGroupRouter from './sitegroup';
router.use('/sitegroup', siteGroupRouter);

import clientRouter from './client';
router.use('/client', clientRouter);

export default router;
