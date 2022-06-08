import React from 'react';
import mocks, { seed } from 'api/src/mocks';
import BulkDeployments from './index';

export default {
  component: BulkDeployments,
  title: 'Components/BulkDeployments',
}

seed();
const data = [
  {
    ...mocks.Deployment(),
    status: 'complete',
  },
  {
    ...mocks.Deployment(),
    status: 'complete',
  },
  {
    ...mocks.Deployment(),
    status: 'complete',
  },
  {
    ...mocks.Deployment(),
    status: 'complete',
  },
];

export const Complete = () => (
  <BulkDeployments
    deployments={data}
  />
);

export const NoDeployments = () => (
  <BulkDeployments
    deployments={[]}
  />
);

export const New = () => (
  <BulkDeployments
    deployments={[
      {
        ...data[0],
        status: 'new',
        started: null,
        completed: data[0].created,
      },
    ]}
  />
);

export const Pending = () => (
  <BulkDeployments
    deployments={[
      {
        ...data[0],
        status: 'pending',
        started: null,
      },
    ]}
  />
);

export const Running = () => (
  <BulkDeployments
    deployments={[
      {
        ...data[0],
        status: 'running',
      },
    ]}
  />
);

export const Cancelled = () => (
  <BulkDeployments
    deployments={[
      {
        ...data[0],
        status: 'cancelled',
      },
    ]}
  />
);

export const Error = () => (
  <BulkDeployments
    deployments={[
      {
        ...data[0],
        status: 'error',
      },
    ]}
  />
);

export const Failed = () => (
  <BulkDeployments
    deployments={[
      {
        ...data[0],
        status: 'failed',
      },
    ]}
  />
);
