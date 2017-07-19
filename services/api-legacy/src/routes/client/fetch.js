import { graphql } from 'graphql';
import { toGlobalId } from 'graphql-relay';
import schema from '../../schema';

export default async (request, response) => {
  try {
    const id = toGlobalId('Client', request.params.client);
    const query = `query {
      client:clientById(id: "${id}") {
        fullJson,
      }
    }`;

    const result = await graphql(schema, query);
    if (result.data.client !== null) {
      response.json({
        status: 'success',
        data: result.data.client.fullJson,
      });
    } else {
      response.status(404).json({
        status: 'fail',
        message: 'The requested client does not exist.',
      });
    }
  } catch (error) {
    response.status(500).json({
      status: 'error',
      message: 'Error while attempting to fetch the client.',
    });

    throw error;
  }
};
