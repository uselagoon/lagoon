import {
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';

import {
  connectionArgs,
  connectionFromPromisedArray,
} from 'graphql-relay';

import siteType, { siteConnection } from '../types/site';

import {
  getAllSites,
  getSiteByName,
} from '../models/site';

export const siteByNameField = {
  type: siteType,
  args: {
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: async (_, { name }) => getSiteByName(name),
};

export const allSitesField = {
  type: siteConnection,
  args: {
    ...connectionArgs,
    environmentType: {
      type: GraphQLString,
    },
  },
  resolve: async (_, { environmentType, ...args }) => connectionFromPromisedArray(getAllSites(environmentType), args),
};
