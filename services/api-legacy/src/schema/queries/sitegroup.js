import {
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';

import {
  fromGlobalId,
  connectionArgs,
  connectionFromArray,
} from 'graphql-relay';

import siteGroupType, { siteGroupConnection } from '../types/sitegroup';

import {
  getAllSiteGroups,
  getSiteGroupById,
  getSiteGroupByName,
  getSiteGroupByGitUrl,
} from '../models/sitegroup';

export const siteGroupByIdField = {
  type: siteGroupType,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: async (_, { id }) => getSiteGroupById(fromGlobalId(id).id),
};

export const siteGroupByNameField = {
  type: siteGroupType,
  args: {
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: async (_, { name }) => getSiteGroupByName(name),
};

export const siteGroupByGitUrlField = {
  type: siteGroupType,
  args: {
    giturl: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: async (_, { giturl }) => getSiteGroupByGitUrl(giturl),
};

export const allSiteGroupsField = {
  type: siteGroupConnection,
  args: Object.assign(connectionArgs, {
    createdAfter: {
      type: GraphQLString,
    },
    giturl: {
      type: GraphQLString,
    },
  }),
  resolve: async (_, args) => {
    const sitegroups = (await getAllSiteGroups())
      .filter((sitegroup) => args.createdAfter ? new Date(args.createdAfter).getTime() < new Date(sitegroup.created).getTime() : true)
      .filter((siteGroup) => args.giturl ? siteGroup.gitUrl === args.giturl : true);
    return connectionFromArray(sitegroups, args);
  },
};
