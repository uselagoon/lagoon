import enqueue from '../../queue';
import { graphql } from 'graphql';
import schema from '../../schema';
import escapeInput from '../../utility/escapeInput';

export default (request, response) => enqueue(async () => {
  const siteGroupName = request.params.siteGroup;

  if (!request.body.hasOwnProperty('definition') || typeof request.body.definition !== 'object') {
    throw new Error('Sitegroup definition is missing or not valid.');
  }

  const fullJson = request.body.definition;

  try {
    const query = `mutation {
      updateSiteGroup(
        input: {
          siteGroupName: "${escapeInput(siteGroupName)}"
          fullJson: "${escapeInput(fullJson)}"
          clientMutationId: ""
        }
      ) {
        siteGroup {
          id
        }
      }
    }`;

    const result = await graphql(schema, query);

    if (!result.hasOwnProperty('errors')) {
      response.status(200).json({
        status: 'success',
        message: `Sitegroup ${siteGroupName} has been updated.`,
      });
    } else {
      response.status(404).json({
        status: 'error',
        message: `Error while attempting to update the sitegroup: ${result.errors[0].message}`,
      });
    }
  } catch (error) {
    response.status(500).json({
      status: 'error',
      message: 'Error while attempting to update the sitegroup.',
    });

    throw error;
  }
});
