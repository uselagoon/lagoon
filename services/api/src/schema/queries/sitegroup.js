// @flow-weak

import { GraphQLString, GraphQLNonNull } from "graphql";

import { connectionArgs, connectionFromArray } from "graphql-relay";

import siteGroupType, { siteGroupConnection } from "../types/sitegroup";

import {
  getAllSiteGroups,
  getSiteGroupByName,
  getSiteGroupByGitUrl
} from "../models/sitegroup";

import type { Context } from "";

export const siteGroupByNameField = {
  type: siteGroupType,
  args: { name: { type: new GraphQLNonNull(GraphQLString) } },
  resolve: async (_, { name }) => getSiteGroupByName(name)
};

export const siteGroupByGitUrlField = {
  type: siteGroupType,
  args: { url: { type: new GraphQLNonNull(GraphQLString) } },
  resolve: async (_, { url }) => getSiteGroupByGitUrl(url)
};

export const allSiteGroupsField = {
  type: siteGroupConnection,
  args: connectionArgs,
  resolve: (_, args, ctx) => {
    const { getState } = ctx;
    const { getAllSiteGroups } = ctx.selectors;

    const ret = getAllSiteGroups(getState());
    console.log(ret);

    return connectionFromArray(ret, args);
  }
};

