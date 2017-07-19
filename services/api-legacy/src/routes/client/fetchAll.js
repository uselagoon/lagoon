import { graphql } from 'graphql';
import schema from '../../schema';

export default async (request, response) => {
  const query = `query {
    viewer {
      clients:allClients {
        edges {
          node {
            clientName
            fullJson
          }
        }
      }
    }
  }`;

  try {
    const result = await graphql(schema, query);

    // @todo Replace this with .reduce().
    const clients = {};
    for (const { node: client } of result.data.viewer.clients.edges) {
      clients[client.clientName] = client.fullJson;
    }

    response.json({
      status: 'success',
      data: {
        clients,
      },
    });
  } catch (error) {
    response.status(500).json({
      status: 'error',
      message: 'Error while attempting to fetch clients.',
    });

    throw error;
  }
};
