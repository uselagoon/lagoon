import { graphql } from 'graphql';
import { toGlobalId } from 'graphql-relay';
import schema from '../../schema';

export default async (request, response) => {
  try {
    const siteName = request.params.siteName;
    const siteHost = request.params.siteHost;
    const id = toGlobalId('Site', `${siteHost}/${siteName}`);
    const query = `query {
      site:siteById(id: "${id}") {
        fullJson,
      }
    }`;

    const result = await graphql(schema, query);
    if (result.data.site !== null) {
      return response.json({
        status: 'success',
        data: {
          [siteHost]: {
            [siteName]: result.data.site.fullJson,
          },
        },
      });
    }

    return response.status(404).json({
      status: 'fail',
      message: 'The requested site does not exist.',
    });
  } catch (error) {
    response.status(500).json({
      status: 'error',
      message: 'Error while attempting to fetch the site.',
    });

    throw error;
  }
};
