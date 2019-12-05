import React from 'react';
import mocks, { seed } from 'api/src/mocks';
import DeploymentsLink from './Deployments';

export default {
  component: DeploymentsLink,
  title: 'Components/link/DeploymentsLink',
};

seed();
const environment = mocks.Environment();

export const Default = () => (
  <DeploymentsLink
    environmentSlug={environment.openshiftProjectName}
    projectSlug={environment.project.name}
  >
    Deployments link
  </DeploymentsLink>
);
