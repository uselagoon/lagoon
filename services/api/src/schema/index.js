// @flow

const { makeExecutableSchema } = require('graphql-tools');
const getContext = require('../getContext');
const getCredentials = require('../getCredentials');
const R = require('ramda');

import type { Slack, SshKey } from '../types';
import type { ClientView, SiteGroupView, SiteView } from '../selectors';

const GraphQLJSON = require('graphql-type-json');

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
    siteGroup: SiteGroup,
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
    allSites(createdAfter: String, environmentType: String): [Site]
    siteByName(name: String!): Site
    allClients(createdAfter: String): [Client]
  }
`;

const createdAfter = (after: string) => (created: string) =>
  new Date(after).getTime() < new Date(created).getTime();

// This applies the query authorization middleware, which will check
// the credentials if given role is allowed to run the given query
// If the user is not authorized, the resolver will not run and return
// null instead
const applyQueryAuthorizationMiddleware = queryObj =>
  R.compose(
    R.mapObjIndexed((resolver, queryName) => (x, args, req, ast) => {
      const context = getContext(req);
      const credentials = getCredentials(req);

      const { allowedQueries } = credentials;

      if (!allowedQueries || R.contains(ast.fieldName, allowedQueries)) {
        return resolver(x, args, req, ast);
      }
    })
  )(queryObj);

const resolvers = {
  JSON: GraphQLJSON,
  Query: applyQueryAuthorizationMiddleware({
    siteGroupByName: (_, args, req, ast) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { findSiteGroup } = context.selectors;

      const credentials = getCredentials(req);

      return findSiteGroup(
        {
          siteGroupName: (name: string) =>
            R.contains(name, credentials.sitegroups) && name === args.name,
        },
        credentials.attributeFilters.sitegroup,
        getState()
      );
    },
    siteGroupByGitUrl: (_, args, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { findSiteGroup } = context.selectors;

      const credentials = getCredentials(req);

      return findSiteGroup(
        {
          siteGroupName: (name: string) =>
            R.contains(name, credentials.sitegroups),
          git_url: args.gitUrl,
        },
        credentials.attributeFilters.sitegroup,
        getState()
      );
    },
    allSiteGroups: (_, args, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { filterSiteGroups } = context.selectors;

      const credentials = getCredentials(req);

      return filterSiteGroups(
        {
          siteGroupName: (id: string) => R.contains(id, credentials.sitegroups),
          git_url: args.gitUrl,
          created: args.createdAfter && createdAfter(args.createdAfter),
        },
        credentials.attributeFilters.sitegroup,
        getState()
      );
    },
    allSites: (_, args, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { filterSites } = context.selectors;

      const credentials = getCredentials(req);

      return filterSites(
        {
          siteName: (name: string) => R.contains(name, credentials.sites),
          site_environment: args.environmentType,
          created: args.createdAfter && createdAfter(args.createdAfter),
        },
        credentials.attributeFilters.site,
        getState()
      );
    },
    siteByName: (_, args, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { findSite } = context.selectors;

      const credentials = getCredentials(req);

      return findSite(
        {
          siteName: (name: string) =>
            R.contains(name, credentials.sites) && name === args.name,
        },
        credentials.attributeFilters.site,
        getState()
      );
    },
    allClients: (_, args, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { filterClients } = context.selectors;

      const credentials = getCredentials(req);

      return filterClients(
        {
          clientName: (name: string) => R.contains(name, credentials.clients),
          created: args.createdAfter && createdAfter(args.createdAfter),
        },
        getState()
      );
    },
  }),
  Client: {
    siteGroups: (client: ClientView, args, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { filterSiteGroups } = context.selectors;

      const credentials = getCredentials(req);

      return filterSiteGroups(
        {
          siteGroupName: (name: string) =>
            R.contains(name, credentials.sitegroups),
          client: client.clientName,
          created: args.createdAfter && createdAfter(args.createdAfter),
        },
        credentials.attributeFilters.sitegroup,
        getState()
      );
    },
    sshKeys: (client: ClientView, _, req) => {
      const context = getContext(req);
      const { extractSshKeys } = context.selectors;

      const credentials = getCredentials(req);

      return (
        R.contains(client.clientName, credentials.clients) &&
        extractSshKeys(client)
      );
    },
    deployPrivateKey: (client: ClientView) => client.deploy_private_key,
  },
  SiteGroup: {
    client: (siteGroup: SiteGroupView, _, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { findClient } = context.selectors;

      const credentials = getCredentials(req);

      return (
        siteGroup.client &&
        findClient(
          {
            clientName: (name: string) =>
              R.contains(name, credentials.clients) &&
              name === siteGroup.client,
          },
          getState()
        )
      );
    },
    billingClient: (siteGroup: SiteGroupView, _, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { findClient } = context.selectors;

      const credentials = getCredentials(req);

      return (
        siteGroup.billingclient &&
        findClient(
          {
            clientName: (name: string) =>
              R.contains(name, credentials.clients) &&
              name === siteGroup.billingclient,
          },
          getState()
        )
      );
    },
    sites: (siteGroup: SiteGroupView, args, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { filterSites } = context.selectors;

      const credentials = getCredentials(req);

      const criteria = {
        sitegroup: (name: string) =>
          R.contains(name, credentials.sitegroups) &&
          name === siteGroup.siteGroupName,
        site_branch: args.branch,
        site_environment: args.environmentType,
        created: args.createdAfter && createdAfter(args.createdAfter),
      };

      return filterSites(
        criteria,
        credentials.attributeFilters.site,
        getState()
      );
    },
    gitUrl: (siteGroup: SiteGroupView) => siteGroup.git_url,
    sshKeys: (siteGroup: SiteGroupView, _, req) => {
      const context = getContext(req);
      const { extractSshKeys } = context.selectors;

      const credentials = getCredentials(req);

      return (
        R.contains(siteGroup.siteGroupName, credentials.sitegroups) &&
        extractSshKeys(siteGroup)
      );
    },
    activeSystems: (siteGroup: SiteGroupView) => siteGroup.active_systems,
  },
  Site: {
    siteBranch: (site: SiteView) => site.site_branch,
    siteGroup: (site: SiteView, args, req) => {
      const context = getContext(req);
      const { getState } = context.store;
      const { findSiteGroup } = context.selectors;

      const credentials = getCredentials(req);

      return findSiteGroup(
        {
          siteGroupName: (name: string) =>
            R.contains(name, credentials.sitegroups) && name === site.sitegroup,
        },
        credentials.attributeFilters.sitegroup,
        getState()
      );
    },
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

module.exports = makeExecutableSchema({ typeDefs, resolvers });
