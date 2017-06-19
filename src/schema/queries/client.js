import {
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';

import {
  connectionArgs,
  connectionFromPromisedArray,
} from 'graphql-relay';

import clientType, { clientConnection } from '../types/client';

import {
  getAllClients,
  getClientByName,
} from '../models/client';

export const clientByNameField = {
  type: clientType,
  args: {
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: async (_, { name }) => getClientByName(name),
};

export const allClientsField = {
  type: clientConnection,
  args: connectionArgs,
  resolve: async (_, args) => connectionFromPromisedArray(getAllClients(), args),
};
