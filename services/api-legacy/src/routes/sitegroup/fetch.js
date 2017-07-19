import { graphql } from 'graphql';
import { toGlobalId } from 'graphql-relay';
import schema from '../../schema';

export default async (request, response) => { // eslint-disable-line consistent-return
  try {
    const id = toGlobalId('SiteGroup', request.params.siteGroup);
    const query = `query {
      siteGroup:siteGroupById(id: "${id}") {
        siteGroupName,
        client {
          clientName,
          fullJson,
        },
        sites {
          edges {
            node {
              siteName,
              serverIdentifier,
              serverInfrastructure,
              fullJson,
            }
          }
        },
        fullJson,
      }
    }`;

    const result = await graphql(schema, query);
    if (result.data.siteGroup !== null) {
      // @todo Replace with .reduce().
      const sites = {};

      for (const { node: site } of result.data.siteGroup.sites.edges) {
        if (!sites.hasOwnProperty(site.siteHost)) {
          sites[site.siteHost] = {};
        }

        sites[site.siteHost][site.siteName] = site.fullJson;
      }

      const data = {
        sites,
        ...result.data.siteGroup.fullJson,
      };

      if (result.data.siteGroup.client !== null) {
        data.client = {
          clientName: result.data.siteGroup.client.clientName,
          ...result.data.siteGroup.client.fullJson,
        };
      }

      response.json({
        status: 'success',
        data,
      });
    } else {
      return response.status(404).json({
        status: 'fail',
        message: 'The requested sitegroup does not exist.',
      });
    }
  } catch (error) {
    response.status(500).json({
      status: 'error',
      message: 'Error while attempting to fetch the sitegroup.',
    });

    throw error;
  }
};
