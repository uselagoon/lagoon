import React from 'react';
import mocks, { seed } from 'api/src/mocks';
import BulkDeploymentLink from './BulkDeployment';

export default {
  component: BulkDeploymentLink,
  title: 'Components/link/BulkDeploymentLink',
};

seed();
const deployment = mocks.Deployment();

export const Default = () => (
  <BulkDeploymentLink
    bulkIdSlug={deployment.bulkId}
  >
    Bulk Deployment link
  </BulkDeploymentLink>
);
