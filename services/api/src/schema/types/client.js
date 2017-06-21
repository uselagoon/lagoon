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
import { siteGroupConnection } from './sitegroup';
import { getAllSiteGroups } from '../models/sitegroup';
import jsonType from './json';

const clientType = new GraphQLObjectType({
  name: 'Client',
  fields: () => ({
    id: globalIdField('Client'),
    clientName: {
      type: GraphQLString,
    },
    fullJson: {
      type: jsonType,
    },
    deployPrivateKey: {
      type: GraphQLString,
    },
    created: {
      type: GraphQLString,
    },
    comment: {
      type: GraphQLString,
    },    
    sitegroups: {
      type: siteGroupConnection,
      args: Object.assign(connectionArgs, {      
        createdAfter: {
          type: GraphQLString,
        },         
      }),
      resolve: async (client, args) => {
        const sitegroups = (await getAllSiteGroups())
          .filter((sitegroups) => sitegroups.clientName === client.clientName)
          .filter((sitegroups) => args.createdAfter ? new Date(args.createdAfter).getTime() < new Date(sitegroups.created).getTime() : true);
        return connectionFromArray(sitegroups, args);
      },
    },
  }),
  interfaces: [nodeInterface],
});

export const { connectionType: clientConnection } = connectionDefinitions({
  name: 'Clients',
  nodeType: clientType,
});

export default clientType;
