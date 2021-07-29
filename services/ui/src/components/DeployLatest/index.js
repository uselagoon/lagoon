import React from 'react';
import { Mutation } from '@apollo/client/react/components';
import gql from 'graphql-tag';
import Button from 'components/Button';
import { bp, color, fontSize } from 'lib/variables';

const DEPLOY_ENVIRONMENT_LATEST_MUTATION = gql`
  mutation deployEnvironmentLatest($environmentId: Int!) {
    deployEnvironmentLatest(input: { environment: { id: $environmentId } })
  }
`;

/**
 * Button that deploys the latest environment.
 */
const DeployLatest = ({ pageEnvironment: environment, fetchMore, ...rest }) => {
  let deploymentsEnabled = true;

  if (
    environment.deployType === 'branch' ||
    environment.deployType === 'promote'
  ) {
    if (!environment.deployBaseRef) {
      deploymentsEnabled = false;
    }
  } else if (environment.deployType === 'pullrequest') {
    if (
      !environment.deployBaseRef &&
      !environment.deployHeadRef &&
      !environment.deployTitle
    ) {
      deploymentsEnabled = false;
    }
  } else {
    deploymentsEnabled = false;
  }

  return (
    <div className="newDeployment">
      {!deploymentsEnabled && (
        <React.Fragment>
          <div className="description">
            Manual deployments are not available for this environment.
          </div>
          <Button disabled>Deploy</Button>
        </React.Fragment>
      )}
      {deploymentsEnabled && (
        <React.Fragment>
          <div className="description">
            {environment.deployType === 'branch' &&
              `Start a new deployment of branch ${environment.deployBaseRef}.`}
            {environment.deployType === 'pullrequest' &&
              `Start a new deployment of pull request ${
                environment.deployTitle
              }.`}
            {environment.deployType === 'promote' &&
              `Start a new deployment from environment ${
                environment.project.name
              }-${environment.deployBaseRef}.`}
          </div>
          <Mutation
            mutation={DEPLOY_ENVIRONMENT_LATEST_MUTATION}
            onCompleted={() => fetchMore()}
            variables={{
              environmentId: environment.id
            }}
          >
            {(deploy, { loading, error, data }) => {
              const success =
                data && data.deployEnvironmentLatest === 'success';
              return (
                <React.Fragment>
                  <Button action={deploy} disabled={loading}>
                    Deploy
                  </Button>

                  {success && (
                    <div className="deploy_result">Deployment queued.</div>
                  )}

                  {error && (
                    <div className="deploy_result">
                      <p>There was a problem deploying.</p>
                      <p>{error.message}</p>
                    </div>
                  )}
                </React.Fragment>
              );
            }}
          </Mutation>
        </React.Fragment>
      )}
      <style jsx>
        {`
          .newDeployment {
            align-items: center;
            background: ${color.white};
            border: 1px solid ${color.lightestGrey};
            border-radius: 3px;
            box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);
            display: flex;
            flex-flow: row wrap;
            justify-content: space-between;
            margin-bottom: 32px;
            padding: 15px;

            @media ${bp.tabletUp} {
              margin-bottom: 0;
            }

            @media ${bp.wideUp} {
              min-width: 52%;
            }

            .description {
              color: ${color.darkGrey};
            }

            .deploy_result {
              margin-top: 20px;
              text-align: right;
              width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
};

export default DeployLatest;
