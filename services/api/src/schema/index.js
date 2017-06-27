// @flow

import { makeExecutableSchema } from 'graphql-tools';

const typeDefs = `
  type SiteGroup {
    id: String!
    siteGroupName: String
    gitUrl: String
    slack: Slack
  }

  type Site {
    id: String
    site_branch: String
  }

  type Slack {
    webhook: String
    channel: String
    inform_start: Boolean
    inform_channel: String
  }

  type Query {
    allSiteGroups: [SiteGroup]
    allSites(environmentType: String!): [Site]
    siteByName(name: String!): Site
  }
`;

const resolvers = {
  Query: {
    allSiteGroups: (_, __, ctx) => {
      const { getState } = ctx;
      const { getAllSiteGroups } = ctx.selectors;

      return getAllSiteGroups(getState());
    },
    allSites: (_, args, ctx) => {
      const { getState } = ctx;
      const { getAllSites } = ctx.selectors;

      return getAllSites(getState(), args.environmentType);
    },
    siteByName: (_, args, ctx) => {
      const { getState } = ctx;
      const { getSiteByName } = ctx.selectors;

      return getSiteByName(getState(), args.name);
    },
  },
};

export default makeExecutableSchema({ typeDefs, resolvers });
