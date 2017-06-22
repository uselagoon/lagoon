
const util = require('util')

import {
  GraphQLString,
  GraphQLObjectType,
} from 'graphql';

import {
  globalIdField,
  connectionDefinitions,
  connectionArgs,
  connectionFromArray,
} from 'graphql-relay';

import { nodeInterface } from '../node';
import { getClientById } from '../models/client';
import { getAllSites } from '../models/site';
import { siteConnection } from './site';
import jsonType from './json';
import clientType from './client';

const siteGroupType = new GraphQLObjectType({
  name: 'SiteGroup',
  fields: () => ({
    id: globalIdField('SiteGroup'),
    siteGroupName: {
      type: GraphQLString,
    },
    client: {
      type: clientType,
      resolve: (siteGroup) => siteGroup.clientName && getClientById(siteGroup.clientName),
    },
    billingClient: {
      type: clientType,
      resolve: (siteGroup) => siteGroup.billingClientName && getClientById(siteGroup.billingClientName),
    },
    created: {
      type: GraphQLString,
    },
    fullJson: {
      type: jsonType,
    },
    slack: {
      type: jsonType,
    },
    openshift: {
      type: jsonType,
    },
    activeSystems: {
      type: jsonType,
    },
    gitUrl: {
      type: GraphQLString,
    },
    comment: {
      type: GraphQLString,
    },
    sites: {
      type: siteConnection,
      args: Object.assign(connectionArgs, {
        branch: {
          type: GraphQLString,
        },
        environment: {
          type: GraphQLString,
        },
        createdAfter: {
          type: GraphQLString,
        },
      }),
      resolve: async (siteGroup, args) => {
        const sites = (await getAllSites())
          .filter((site) => site.siteGroup === siteGroup.siteGroupName)
          .filter((site) => args.branch ? site.siteBranch === args.branch : true)
          .filter((site) => args.environment ? site.siteEnvironment === args.environment : true)
          .filter((site) => args.createdAfter ? new Date(args.createdAfter).getTime() < new Date(site.created).getTime() : true);
        return connectionFromArray(sites, args);
      },
    },
  }),
  interfaces: [nodeInterface],
});

export const { connectionType: siteGroupConnection } = connectionDefinitions({
  name: 'SiteGroups',
  nodeType: siteGroupType,
});

export default siteGroupType;
