import { GraphQLString, GraphQLObjectType, GraphQLBoolean } from "graphql";

import {
  globalIdField,
  connectionDefinitions,
  connectionArgs,
  connectionFromArray
} from "graphql-relay";

import { nodeInterface } from "../node";
import { getClientByName } from "../models/client";
import { getAllSites } from "../models/site";
import { siteConnection } from "./site";
import clientType from "./client";

const slackType = new GraphQLObjectType({
  name: "Slack",
  fields: () => ({
    webhook: {type: GraphQLString},
    channel: {type: GraphQLString},
    inform_start: {type: GraphQLBoolean},
    inform_channel: {type: GraphQLString}
  })
});

const siteGroupType = new GraphQLObjectType({
  name: "SiteGroup",
  fields: () => ({
    id: globalIdField("SiteGroup"),
    siteGroupName: { type: GraphQLString },
    client: {
      type: clientType,
      resolve: siteGroup =>
        siteGroup.clientName && getClientByName(siteGroup.clientName)
    },
    slack: { type: slackType },
    gitUrl: { type: GraphQLString },
    sites: {
      type: siteConnection,
      args: { ...connectionArgs, branch: { type: GraphQLString } },
      resolve: async (siteGroup, { branch, ...args }) => {
        const sites = (await getAllSites())
          .filter(site => site.siteGroup === siteGroup.siteGroupName)
          .filter(site => branch && site.siteBranch === branch || true);

        return connectionFromArray(sites, args);
      }
    }
  }),
  interfaces: [ nodeInterface ]
});

export const { connectionType: siteGroupConnection } = connectionDefinitions({
  name: "SiteGroups",
  nodeType: siteGroupType
});

export default siteGroupType;

