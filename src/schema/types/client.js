import {
  GraphQLString,
  GraphQLObjectType,
} from 'graphql';

import {
  globalIdField,
  connectionDefinitions,
} from 'graphql-relay';

import { nodeInterface } from '../node';

const clientType = new GraphQLObjectType({
  name: 'Client',
  fields: () => ({
    id: globalIdField('Client'),
    clientName: {
      type: GraphQLString,
    },
    deployPrivateKey: {
      type: GraphQLString,
    },
  }),
  interfaces: [nodeInterface],
});

export const { connectionType: clientConnection } = connectionDefinitions({
  name: 'Clients',
  nodeType: clientType,
});

export default clientType;
