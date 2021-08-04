import React from 'react';
import DeploymentNotFound from './DeploymentNotFound';

export default {
  component: DeploymentNotFound,
  title: 'Components/Errors/DeploymentNotFound',
}

export const Default = () => (
  <DeploymentNotFound
    variables={{
      deploymentName: 'build-42',
    }}
  />
);
