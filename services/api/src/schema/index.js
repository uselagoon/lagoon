// @flow

import R from 'ramda';
import { makeExecutableSchema } from 'graphql-tools';

const extractSshKeys = R.compose(
  R.ifElse(R.isEmpty, () => null, value => value),
  R.map(([owner, value]) => ({ ...value, owner })),
  Object.entries,
  R.propOr({}, 'ssh_keys'),
);

const typeDefs = `
  type SiteGroup {
    id: String!
    site_group_name: String
    git_url: String
    slack: Slack
    client: Client
    ssh_keys: [SshKey]
  }

  type Site {
    id: String
    site_branch: String
  }

  type Client {
    client_name: String
    deploy_private_key: String
    created:String
    comment: String
    site_groups: [SiteGroup]
    ssh_keys: [SshKey]
  }

  type SshKey {
    owner: String
    key: String
    type: String
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
    allClients: [Client]
  }
`;

const resolvers = {
  Query: {
    allSiteGroups: (_, __, req) => {
      const context = req.app.get('context');
      const { getState } = context.store;
      const { getAllSiteGroups } = context.selectors;

      return getAllSiteGroups(getState());
    },
    allSites: (_, args, req) => {
      const context = req.app.get('context');
      const { getState } = context.store;
      const { getAllSites } = context.selectors;

      return getAllSites(getState(), args.environmentType);
    },
    siteByName: (_, args, req) => {
      const context = req.app.get('context');
      const { getState } = context.store;
      const { getSiteByName } = context.selectors;

      return getSiteByName(getState(), args.name);
    },
    allClients: (_, __, req) => {
      const context = req.app.get('context');
      const { getState } = context.store;
      const { getAllClients } = context.selectors;

      return getAllClients(getState());
    },
  },
  Client: {
    site_groups: (client, _, req) => {
      const context = req.app.get('context');
      const { getState } = context.store;
      const { getSiteGroupsByClient } = context.selectors;

      return getSiteGroupsByClient(getState(), client);
    },
    ssh_keys: client => extractSshKeys(client),
  },
  SiteGroup: {
    client: (siteGroup, _, req) => {
      const context = req.app.get('context');
      const { getState } = context.store;
      const { getClientByName } = context.selectors;

      return getClientByName(getState(), siteGroup.client);
    },
    ssh_keys: client => extractSshKeys(client),
  },
};

export default makeExecutableSchema({ typeDefs, resolvers });
