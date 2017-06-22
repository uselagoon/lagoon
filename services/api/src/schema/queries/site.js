import {
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';

import {
  fromGlobalId,
  connectionArgs,
  connectionFromArray,
} from 'graphql-relay';

import siteType, { siteConnection } from '../types/site';

import {
  getAllSites,
  getSiteById,
} from '../models/site';

export const siteByIdField = {
  type: siteType,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: async (_, { id }) => getSiteById(fromGlobalId(id).id),
};

export const allSitesField = {
  type: siteConnection,
  args: Object.assign(connectionArgs, {   
    createdAfter: {
      type: GraphQLString,
    },
    environmentType: {
      type: GraphQLString,      
    }
  }),
  resolve: async (_, args) => {
    const sites = (await getAllSites())
      .filter((site) => args.createdAfter ? new Date(args.createdAfter).getTime() < new Date(site.created).getTime() : true)
      .filter((site) => args.environmentType ? args.environmentType == site.siteEnvironment : true);      
    return connectionFromArray(sites, args);
  },
};
