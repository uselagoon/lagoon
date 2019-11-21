import React from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import ButtonAction from 'components/Button/ButtonAction';
import { bp, color, fontSize } from 'lib/variables';

const CANCEL_DEPLOYMENT_MUTATION = gql`
  mutation cancelDeployment($deploymentId: Int!) {
    cancelDeployment(input: { deployment: { id: $deploymentId } })
  }
`;

const CancelDeployment = ({ deployment, ...rest }) => (
  <Mutation
    mutation={CANCEL_DEPLOYMENT_MUTATION}
    variables={{
      deploymentId: deployment.id
    }}
  >
    {(cancelDeploy, { loading, error, data }) => {
      const success = data && data.cancelDeployment === 'success';
      return (
        <React.Fragment>
          <ButtonAction action={cancelDeploy} disabled={loading || success}>
            {success ? 'Cancellation requested' : 'Cancel deployment'}
          </ButtonAction>

          {error && (
            <div className="deploy_result">
              <p>There was a problem cancelling deployment.</p>
              <p>{error.message}</p>
            </div>
          )}
        </React.Fragment>
      );
    }}
  </Mutation>
);

export default CancelDeployment;
