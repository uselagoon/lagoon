import { GraphQLString, GraphQLNonNull } from 'graphql';

import { connectionArgs, connectionFromPromisedArray } from 'graphql-relay';

import siteGroupType, { siteGroupConnection } from '../types/sitegroup';

import {
  getAllSiteGroups,
  getSiteGroupByName,
  getSiteGroupByGitUrl,
} from '../models/sitegroup';

export const siteGroupByNameField = {
  type: siteGroupType,
  args: { name: { type: new GraphQLNonNull(GraphQLString) } },
  resolve: async (_, { name }) => getSiteGroupByName(name),
};

export const siteGroupByGitUrlField = {
  type: siteGroupType,
  args: { url: { type: new GraphQLNonNull(GraphQLString) } },
  resolve: async (_, { url }) => getSiteGroupByGitUrl(url),
};

export const allSiteGroupsField = {
  type: siteGroupConnection,
  args: connectionArgs,
  resolve: async (_, args) =>
    connectionFromPromisedArray(getAllSiteGroups(), args),
};
