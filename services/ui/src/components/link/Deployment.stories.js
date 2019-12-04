import React from 'react';
import mocks, { seed } from 'api/src/mocks';
import DeploymentLink from './Deployment';

export default {
  component: DeploymentLink,
  title: 'Components/link/DeploymentLink',
};

seed();
const deployment = mocks.Deployment();

export const Default = () => (
  <DeploymentLink
    deploymentSlug={deployment.name}
    environmentSlug={deployment.environment.openshiftProjectName}
    projectSlug={deployment.environment.project.name}
  >
    Deployment link
  </DeploymentLink>
);
