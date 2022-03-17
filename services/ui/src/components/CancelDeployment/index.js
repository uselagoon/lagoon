import React from 'react';
import { Mutation } from 'react-apollo';
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
  error,
  beforeText,
  afterText
}) => (
  <>
    <Button action={action} disabled={loading || success}>
      {success ? afterText || 'Cancellation requested' : beforeText || 'Cancel deployment'}
    </Button>

    {error && (
      <div className="deploy_result">
        <p>There was a problem cancelling deployment.</p>
        <p>{error.message}</p>
      </div>
    )}
  </>
);

const CancelDeployment = ({ deployment, beforeText, afterText }) => (
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
        beforeText={beforeText}
        afterText={afterText}
      />
    )}
  </Mutation>
);

export default CancelDeployment;
