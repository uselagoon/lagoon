import React from 'react';
import EnvironmentNotFound from './EnvironmentNotFound';

export default {
  component: EnvironmentNotFound,
  title: 'Components/Errors/EnvironmentNotFound',
}

export const Default = () => (
  <EnvironmentNotFound
    variables={{
      openshiftProjectName: 'fortytwo-pr-42',
    }}
  />
);
