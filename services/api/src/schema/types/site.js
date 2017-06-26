import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
} from 'graphql';

import { globalIdField, connectionDefinitions } from 'graphql-relay';

import { nodeInterface } from '../node';
import { getSiteGroupByName } from '../models/sitegroup';
import siteGroupType from './sitegroup';

const siteType = new GraphQLObjectType({
  name: 'Site',
  fields: () => ({
    id: globalIdField('Site'),
    siteHost: { type: GraphQLString },
    siteName: { type: GraphQLString },
    siteGroup: {
      type: siteGroupType,
      resolve: ({ siteGroup }) => getSiteGroupByName(siteGroup),
    },
    siteBranch: { type: GraphQLString },
    siteEnvironment: { type: GraphQLString },
    serverInfrastructure: { type: GraphQLString },
    serverIdentifier: { type: GraphQLString },
    serverNames: { type: new GraphQLList(GraphQLString) },
    webRoot: { type: GraphQLString },
    drupalVersion: { type: GraphQLString },
    sslCertificateType: { type: GraphQLString },
    fpmProfile: { type: GraphQLString },
    domains: { type: new GraphQLList(GraphQLString) },
    redirectDomains: { type: new GraphQLList(GraphQLString) },
    redirects: { type: GraphQLString },
    uid: { type: GraphQLInt },
    dbPassword: { type: GraphQLString },
    dbUser: { type: GraphQLString },
    cron: {
      type: new GraphQLObjectType({
        name: 'Cron',
        fields: {
          type: { type: GraphQLString },
          minute: { type: GraphQLString },
        },
      }),
    },
    customCron: { type: GraphQLString },
    envVariables: { type: GraphQLString },
    noPrefixenvVariables: { type: GraphQLString },
    phpValues: { type: GraphQLString },
    phpAdminValues: { type: GraphQLString },
    phpFlags: { type: GraphQLString },
    phpAdminFlags: { type: GraphQLString },
    xdebug: { type: GraphQLString },
    nginxSitespecific: { type: GraphQLBoolean },
    nginxSiteconfig: { type: GraphQLString },
    solrEnabled: { type: GraphQLBoolean },
    redisEnabled: { type: GraphQLBoolean },
    sshKeys: { type: GraphQLString },
    phpVersion: { type: GraphQLString },
    redirectToHttps: { type: GraphQLString },
    ensure: { type: GraphQLString },
    upstreamURL: { type: GraphQLString },
    deployStrategy: { type: GraphQLString },
    apc: { type: GraphQLString },
    jumpHost: { type: GraphQLString },
    basicAuth: {
      type: new GraphQLObjectType({
        name: 'BasicAuth',
        fields: {
          username: { type: GraphQLString },
          password: { type: GraphQLString },
        },
      }),
    },
  }),
  interfaces: [nodeInterface],
});

export const { connectionType: siteConnection } = connectionDefinitions({
  name: 'Sites',
  nodeType: siteType,
});

export default siteType;
