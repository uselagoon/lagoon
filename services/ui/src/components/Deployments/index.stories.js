import React from 'react';
import mocks, { seed } from 'api/src/mocks';
import Deployments from './index';

export default {
  component: Deployments,
  title: 'Components/Deployments',
  parameters: {
    layout: 'fullscreen'
  }
}

const data = [
  {
    ...mocks.Deployment(null, mocks.Project()),
    status: 'complete',
  },
  {
    ...mocks.Deployment(null, mocks.Project()),
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
  <Deployments
    deployments={data}
  />
);

export const NoDeployments = () => (
  <Deployments
    deployments={[]}
  />
);

export const New = () => (
  <Deployments
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
  <Deployments
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
  <Deployments
    deployments={[
      {
        ...data[0],
        status: 'running',
      },
    ]}
  />
);

export const Cancelled = () => (
  <Deployments
    deployments={[
      {
        ...data[0],
        status: 'cancelled',
      },
    ]}
  />
);

export const Error = () => (
  <Deployments
    deployments={[
      {
        ...data[0],
        status: 'error',
      },
    ]}
  />
);

export const Failed = () => (
  <Deployments
    deployments={[
      {
        ...data[0],
        status: 'failed',
      },
    ]}
  />
);
