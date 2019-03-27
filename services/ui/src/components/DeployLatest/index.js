import React from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import { bp, color, fontSize } from 'lib/variables';

const DEPLOY_ENVIRONMENT_LATEST_MUTATION = gql`
  mutation deployEnvironmentLatest(
    $environmentId: Int!
  ) {
    deployEnvironmentLatest(
      input: {
        environment: {
          id: $environmentId
        }
      }
    )
  }
`;

const DeployLatest = ({
  pageEnvironment,
}) => {
  return (
    <React.Fragment>
      <div className="newDeploymentWrapper">
        <div className="newDeployment">
          <Mutation
            mutation={DEPLOY_ENVIRONMENT_LATEST_MUTATION}
          >
            {(deploy, { loading, called, error, data }) => {
              const success = data && data.deployEnvironmentLatest === 'success';
              return (
                <React.Fragment>
                  <button
                    onClick={() =>
                      deploy({
                        variables: {
                          environmentId: pageEnvironment.id,
                        }
                      })
                    }
                    disabled={loading}
                  >
                    Deploy
                  </button>

                  {success &&
                    <div className="deploy_result">
                      Deployment queued.
                    </div>}

                  {error &&
                    <div className="deploy_result">
                      <p>There was a problem deploying.</p>
                      <p>{error.message}</p>
                    </div>}
                </React.Fragment>
              );
            }}
          </Mutation>
        </div>
      </div>
      <style jsx>
        {`
          .newDeploymentWrapper {
            @media ${bp.wideUp} {
              display: flex;
            }
            &::before {
              @media ${bp.wideUp} {
                content: '';
                display: block;
                flex-grow: 1;
              }
            }
          }
          .newDeployment {
            background: ${color.white};
            border: 1px solid ${color.lightestGrey};
            border-radius: 3px;
            box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);
            display: flex;
            flex-flow: column;
            margin-bottom: 32px;
            padding: 32px 20px;
            @media ${bp.tabletUp} {
              margin-bottom: 0;
            }
            @media ${bp.wideUp} {
              min-width: 52%;
            }
            .deploy_result {
              margin-top: 20px;
            }
          }
          button {
            align-self: flex-end;
            background-color: ${color.lightestGrey};
            border: none;
            border-radius: 20px;
            color: ${color.darkGrey};
            font-family: 'source-code-pro', sans-serif;
            ${fontSize(13)};
            padding: 3px 20px 2px;
            text-transform: uppercase;
            @media ${bp.tinyUp} {
              align-self: auto;
            }
          }
        `}
      </style>
    </React.Fragment>
  );
};

export default DeployLatest;
