import {
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';

import {
  fromGlobalId,
  connectionArgs,
  connectionFromArray,
} from 'graphql-relay';

import clientType, { clientConnection } from '../types/client';

import {
  getAllClients,
  getClientById,
} from '../models/client';

export const clientByIdField = {
  type: clientType,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: async (_, { id }) => getClientById(fromGlobalId(id).id),
};

export const allClientsField = {
  type: clientConnection,
  args: Object.assign(connectionArgs, {   
    createdAfter: {
      type: GraphQLString,
    },         
  }),
  resolve: async (_, args) => {
    const clients = (await getAllClients())
      .filter((client) => args.createdAfter ? new Date(args.createdAfter).getTime() < new Date(client.created).getTime() : true);
    return connectionFromArray(clients, args);
  },
};
