import { graphql } from 'graphql';
import enqueue from '../../queue';
import escapeInput from '../../utility/escapeInput';
import schema from '../../schema';

export default (request, response) => enqueue(async () => {
  try {
    const siteHost = request.params.siteHost;
    const siteName = request.params.siteName;
    const fullJson = typeof request.body.definition === 'object' && request.body.definition;
    if (!fullJson) {
      throw new Error('Site definition is missing or not valid.');
    }

    const query = `mutation {
      updateSite(
        input: {
          siteName: "${escapeInput(siteName)}"
          siteHost: "${escapeInput(siteHost)}"
          fullJson: "${escapeInput(fullJson)}"
          clientMutationId: ""
        }
      ) {
        site {
          id
        }
      }
    }`;

    const result = await graphql(schema, query);

    if (!result.hasOwnProperty('errors')) {
      response.status(200).json({
        status: 'success',
        message: `Site ${siteName} has been updated at the ${siteHost} server.`,
      });
    } else {
      response.status(500).json({
        status: 'error',
        message: `Error while attempting to update the site: ${result.errors[0].message}`,
      });
    }
  } catch (error) {
    response.status(500).json({
      status: 'error',
      message: `Error while attempting to update the site: ${error.message}`,
    });

    throw error;
  }
});
