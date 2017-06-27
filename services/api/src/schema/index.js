// @flow

import { makeExecutableSchema } from 'graphql-tools';

const typeDefs = `
  type SiteGroup {
    id: String!
    siteGroupName: String
    gitUrl: String
    slack: Slack
  }

  type Slack {
    webhook: String
    channel: String
    inform_start: Boolean
    inform_channel: String
  }

  type Query {
    allSiteGroups: [SiteGroup]
  }
`;

const resolvers = {
  Query: {
    allSiteGroups: (_, __, ctx) => {
      const { getState } = ctx;
      const { getAllSiteGroups } = ctx.selectors;

      return getAllSiteGroups(getState());
    },
  },
};

export default makeExecutableSchema({ typeDefs, resolvers });
