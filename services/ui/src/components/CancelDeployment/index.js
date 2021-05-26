import React from 'react';
import { Mutation } from '@apollo/client';
import gql from 'graphql-tag';
import Button from 'components/Button';

const CANCEL_DEPLOYMENT_MUTATION = gql`
  mutation cancelDeployment($deploymentId: Int!) {
    cancelDeployment(input: { deployment: { id: $deploymentId } })
  }
`;

export const CancelDeploymentButton = ({
  action,
  success,
  loading,
  error
}) => (
  <>
    <Button action={action} disabled={loading || success}>
      {success ? 'Cancellation requested' : 'Cancel deployment'}
    </Button>

    {error && (
      <div className="deploy_result">
        <p>There was a problem cancelling deployment.</p>
        <p>{error.message}</p>
      </div>
    )}
  </>
);

const CancelDeployment = ({ deployment }) => (
  <Mutation
    mutation={CANCEL_DEPLOYMENT_MUTATION}
    variables={{
      deploymentId: deployment.id
    }}
  >
    {(cancelDeploy, { loading, error, data }) => (
      <CancelDeploymentButton
        action={cancelDeploy}
        success={data && data.cancelDeployment === 'success'}
        loading={loading}
        error={error}
      />
    )}
  </Mutation>
);

export default CancelDeployment;
