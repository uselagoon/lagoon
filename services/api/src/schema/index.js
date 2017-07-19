// @flow

import { makeExecutableSchema } from 'graphql-tools';
import { getContext } from '../app';
import type { Slack } from '../types';
import type { ClientView, SiteGroupView, SiteView } from '../selectors';
import GraphQLJSON from 'graphql-type-json';

const typeDefs = `
  scalar JSON

  type SiteGroup {
    siteGroupName: String
    gitUrl: String
    slack: Slack
    client: Client
    sshKeys: [SshKey]
    sites(branch: String, environmentType: String, createdAfter: String): [Site]
    openshift: JSON
    billingClient: Client
    created: String
    activeSystems: JSON
    comment: String
  }

  type Cron {
    type: String
    minute: String
  }

  type BasicAuth {
    username: String
  }

  type Site {
    id: String
    siteBranch: String
    uid: String
    siteHost: String
    siteName: String
    fileName: String
    siteEnvironment: String
    serverInfrastructure: String
    siteEnvironment: String,
    serverIdentifier: String
    serverNames: [String]
    webRoot: String
    SSLCertificateType: String
    cron: Cron
    solrEnabled: Boolean
    drupalVersion: String
    FPMProfile: String
    domains: [String]
    redirectDomains: [String]
    redirects: JSON
    dbUser: String
    customCron: JSON
    envVariables: JSON
    noPrefixenvVariables: JSON
    phpValues: JSON
    phpAdminFlags: JSON
    xdebug: String
    nginxSitespecific: Boolean
    nginxSiteconfig: String
    jumpHost: String
    redisEnabled: Boolean
    deployStrategy: String
    sshKeys: JSON
    phpVersion: String
    redirectToHttps: String
    ensure: JSON
    upstreamURL: String
    apc: String
    basicAuth: BasicAuth
    created: String
    comment: String
    monitoringLevel: String
    uptimeMonitoringUri: String
  }

  type Client {
    clientName: String
    deployPrivateKey: String
    created: String
    comment: String
    siteGroups(createdAfter: String): [SiteGroup]
    sshKeys: [SshKey]
  }

  type SshKey {
    owner: String
    key: String
    type: String
  }

  type Slack {
    webhook: String
    channel: String
    informStart: Boolean
    informChannel: String
  }

  type Query {
    siteGroupByName(name: String!): SiteGroup
    siteGroupByGitUrl(gitUrl: String!): SiteGroup
    allSiteGroups(createdAfter: String, gitUrl: String): [SiteGroup]
    allSites(environmentType: String!): [Site]
    siteByName(name: String!): Site
    allClients: [Client]
  }
`;

const createdAfter = (after: string) => (created: string) =>
  new Date(after).getTime() < new Date(created).getTime();

const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    siteGroupByName: (_, args, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { findSiteGroup } = context.selectors;

      return findSiteGroup({
        siteGroupName: args.name,
      }, getState());
    },
    siteGroupByGitUrl: (_, args, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { findSiteGroup } = context.selectors;

      return findSiteGroup({
        git_url: args.gitUrl,
      }, getState());
    },
    allSiteGroups: (_, args, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { filterSiteGroups } = context.selectors;

      return filterSiteGroups({
        git_url: args.gitUrl,
        created: args.createdAfter && createdAfter(args.createdAfter),
      }, getState());
    },
    allSites: (_, args, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { filterSites } = context.selectors;

      return filterSites({
        site_environment: args.environmentType,
      }, getState());
    },
    siteByName: (_, args, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { findSite } = context.selectors;

      return findSite({
        siteName: args.name,
      }, getState());
    },
    allClients: (_, __, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { getAllClients } = context.selectors;

      return getAllClients(getState());
    },
  },
  Client: {
    siteGroups: (client: ClientView, args, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { filterSiteGroups } = context.selectors;

      return filterSiteGroups({
        client: client.clientName,
        created: args.createdAfter && createdAfter(args.createdAfter),
      }, getState());
    },
    sshKeys: (client: ClientView, _, req) => {
      const context = getContext(req);
      const { extractSshKeys } = context.selectors;

      return extractSshKeys(client);
    },
  },
  SiteGroup: {
    client: (siteGroup: SiteGroupView, _, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { findClient } = context.selectors;

      return siteGroup.client && findClient({
        clientName: siteGroup.client,
      }, getState());
    },
    billingClient: (siteGroup: SiteGroupView, _, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { findClient } = context.selectors;

      return siteGroup.billingclient && findClient({
        clientName: siteGroup.billingclient,
      }, getState());
    },
    sites: (siteGroup: SiteGroupView, args, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { filterSites } = context.selectors;

      return filterSites({
        sitegroup: siteGroup.siteGroupName,
        site_branch: args.branch,
        site_environment: args.environmentType,
        created: args.createdAfter && createdAfter(args.createdAfter),
      }, getState());
    },
    gitUrl: (siteGroup: SiteGroupView) => siteGroup.git_url,
    sshKeys: (siteGroup: SiteGroupView, _, req) => {
      const context = getContext(req);
      const { extractSshKeys } = context.selectors;

      return extractSshKeys(siteGroup);
    },
    activeSystems: (siteGroup: SiteGroupView) => siteGroup.active_systems,
  },
  Site: {
    siteBranch: (site: SiteView) => site.site_branch,
    siteEnvironment: (site: SiteView) => site.site_environment,
    webRoot: (site: SiteView) => site.webroot,
    SSLCertificateType: (site: SiteView) => site.sslcerttype,
    solrEnabled: (site: SiteView) => site.solr_enabled,
    drupalVersion: (site: SiteView) => site.drupal_version,
    FPMProfile: (site: SiteView) => site.fpm_profile,
    redirectDomains: (site: SiteView) => site.redirect_domains,
    dbUser: (site: SiteView) => site.db_user,
    customCron: (site: SiteView) => site.custom_cron,
    envVariables: (site: SiteView) => site.env_variables,
    noPrefixenvVariables: (site: SiteView) => site.no_prefixenv_variables,
    phpValues: (site: SiteView) => site.php_values,
    phpAdminFlags: (site: SiteView) => site.php_admin_flags,
    nginxSitespecific: (site: SiteView) => site.nginx_sitespecific,
    nginxSiteconfig: (site: SiteView) => site.nginx_siteconfig,
    redisEnabled: (site: SiteView) => site.redis_enabled,
    sshKeys: (site: SiteView) => site.ssh_keys,
    phpVersion: (site: SiteView) => site.php_version,
    redirectToHttps: (site: SiteView) => site.redirect_to_https,
    upstreamURL: (site: SiteView) => site.upstream_url,
    basicAuth: (site: SiteView) => site.basic_auth,
    deployStrategy: (site: SiteView) => site.deploy_strategy,
    monitoringLevel: (site: SiteView) => site.monitoring_level,
    uptimeMonitoringUri: (site: SiteView) => site.uptime_monitoring_uri,
  },
  Slack: {
    informStart: (slack: Slack) => slack.inform_start,
    informChannel: (slack: Slack) => slack.inform_channel,
  },
};

export default makeExecutableSchema({ typeDefs, resolvers });
