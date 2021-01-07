import React from 'react';
import mocks, { seed } from 'api/src/mocks';
import DeployLatest from './index';

export default {
  component: DeployLatest,
  title: 'Components/Deploy Latest',
}

seed();
const environment = mocks.Environment(null, {name: 'main'});

export const Default = () => (
  <DeployLatest pageEnvironment={environment} />
);

export const Branch = () => (
  <DeployLatest pageEnvironment={environment} />
);
Branch.story = {
  parameters: {
    docs: {
      storyDescription: 'Deploy a branch.',
    },
  },
};

export const PromoteEnvironment = () => (
  <DeployLatest pageEnvironment={{
    ...environment,
    deployType: 'promote',
  }} />
);
PromoteEnvironment.story = {
  parameters: {
    docs: {
      storyDescription: 'Deploy an environment.',
    },
  },
};

const prEnvironment = mocks.Environment(false, 'pr-100');
export const PullRequest = () => (
  <DeployLatest pageEnvironment={prEnvironment} />
);
PullRequest.story = {
  parameters: {
    docs: {
      storyDescription: 'Deployment a pull request.',
    },
  },
};

export const Unavailable = () => (
  <DeployLatest pageEnvironment={{
    ...environment,
    deployBaseRef: '',
  }} />
);
Unavailable.story = {
  parameters: {
    docs: {
      storyDescription: 'Deployments are not available.',
    },
  },
};

export const Loading = () => '@TODO';
Loading.story = {
  parameters: {
    docs: {
      storyDescription: '@TODO Not yet implemented.',
    },
  },
};

export const DeploySuccessful = () => '@TODO';
DeploySuccessful.story = {
  parameters: {
    docs: {
      storyDescription: '@TODO Not yet implemented.',
    },
  },
};

export const Error = () => '@TODO';
Error.story = {
  parameters: {
    docs: {
      storyDescription: '@TODO Not yet implemented.',
    },
  },
};
