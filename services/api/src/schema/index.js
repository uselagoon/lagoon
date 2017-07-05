// @flow

import { makeExecutableSchema } from 'graphql-tools';
import { getContext } from '../app';

import type { Client, SiteGroup } from '../types';

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
    uid: String
    siteHost: String
    fileName: String
    serverInfrastructure: String
    serverIdentifier: String
    serverNames: [String]
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
      const context = getContext(req);
      const { getState } = context.store;
      const { getAllSiteGroups } = context.selectors;

      return getAllSiteGroups(getState());
    },
    allSites: (_, args, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { getAllSitesByEnv } = context.selectors;

      return getAllSitesByEnv(getState(), args.environmentType);
    },
    siteByName: (_, args, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { getSiteByName } = context.selectors;

      return getSiteByName(getState(), args.name);
    },
    allClients: (_, __, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { getAllClients } = context.selectors;

      return getAllClients(getState());
    },
  },
  Client: {
    site_groups: (client, _, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { getSiteGroupsByClient } = context.selectors;

      return getSiteGroupsByClient(getState(), client.client_name);
    },
    ssh_keys: (client, _, req) => {
      const context = getContext(req);
      const { extractSshKeys } = context.selectors;

      return extractSshKeys(client);
    },
  },
  SiteGroup: {
    client: (siteGroup, _, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { getClientByName } = context.selectors;

      return getClientByName(getState(), siteGroup.client);
    },
    ssh_keys: (client: Client, _, req) => {
      const context = getContext(req);
      const { extractSshKeys } = context.selectors;

      return extractSshKeys(client);
    },
  },
};

export default makeExecutableSchema({ typeDefs, resolvers });
