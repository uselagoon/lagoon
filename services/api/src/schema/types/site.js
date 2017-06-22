import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
} from 'graphql';

import {
  globalIdField,
  connectionDefinitions,
} from 'graphql-relay';

import { nodeInterface } from '../node';
import { getSiteGroupByName } from '../models/sitegroup';
import siteGroupType from './sitegroup';
import jsonType from './json';

const siteType = new GraphQLObjectType({
  name: 'Site',
  fields: () => ({
    id: globalIdField('Site'),
    created: {
      type: GraphQLString,
    },
    siteHost: {
      type: GraphQLString,
    },
    siteName: {
      type: GraphQLString,
    },
    siteGroup: {
      type: siteGroupType,
      resolve: ({ siteGroup }) => getSiteGroupByName(siteGroup),
    },
    siteBranch: {
      type: GraphQLString,
    },
    siteEnvironment: {
      type: GraphQLString,
    },
    serverInfrastructure: {
      type: GraphQLString,
    },
    serverIdentifier: {
      type: GraphQLString,
    },
    serverNames: {
      type: new GraphQLList(GraphQLString),
    },
    webRoot: {
      type: GraphQLString,
    },
    drupalVersion: {
      type: GraphQLString,
    },
    SSLCertificateType: {
      type: GraphQLString,
    },
    FPMProfile: {
      type: GraphQLString,
    },
    domains: {
      type: new GraphQLList(GraphQLString),
    },
    redirectDomains: {
      type: new GraphQLList(GraphQLString),
    },
    redirects: {
      type: jsonType,
    },
    uid: {
      type: GraphQLInt,
    },
    dbPassword: {
      type: GraphQLString,
    },
    dbUser: {
      type: GraphQLString,
    },
    cron: {
      type: new GraphQLObjectType({
        name: 'Cron',
        fields: {
          type: {
            type: GraphQLString,
          },
          minute: {
            type: GraphQLString,
          },
        },
      }),
    },
    customCron: {
      type: jsonType,
    },
    envVariables: {
      type: jsonType,
    },
    noPrefixenvVariables: {
      type: jsonType,
    },
    phpValues: {
      type: jsonType,
    },
    phpAdminValues: {
      type: jsonType,
    },
    phpFlags: {
      type: jsonType,
    },
    phpAdminFlags: {
      type: jsonType,
    },
    xdebug: {
      type: GraphQLString,
    },
    nginxSitespecific: {
      type: GraphQLBoolean,
    },
    nginxSiteconfig: {
      type: GraphQLString,
    },
    solrEnabled: {
      type: GraphQLBoolean,
    },
    redisEnabled: {
      type: GraphQLBoolean,
    },
    sshKeys: {
      type: jsonType,
    },
    phpVersion: {
      type: GraphQLString,
    },
    redirectToHttps: {
      type: GraphQLString,
    },
    ensure: {
      type: jsonType,
    },
    upstreamURL: {
      type: GraphQLString,
    },
    deployStrategy: {
      type: GraphQLString,
    },
    apc: {
      type: GraphQLString,
    },
    jumpHost: {
      type: GraphQLString,
    },
    comment: {
      type: GraphQLString,
    },
    basicAuth: {
      type: new GraphQLObjectType({
        name: 'BasicAuth',
        fields: {
          username: {
            type: GraphQLString,
          },
          password: {
            type: GraphQLString,
          },
        },
      }),
    },
    monitoringLevel: {
      type: GraphQLString
    },
    uptimeMonitoringUri: {
      type: GraphQLString
    },
    fullJson: {
      type: jsonType,
    },
  }),
  interfaces: [nodeInterface],
});

export const { connectionType: siteConnection } = connectionDefinitions({
  name: 'Sites',
  nodeType: siteType,
});

export default siteType;
