import React from 'react';
import { action } from '@storybook/addon-actions';
import { CancelDeploymentButton as CancelDeployment } from './index';

export default {
  component: CancelDeployment,
  title: 'Components/CancelDeployment',
};

const rest = {
  action: action('button-clicked'),
  success: false,
  loading: false,
  error: false,
};

export const Default = () => (
  <CancelDeployment
    deployment={{id: 42}}
    {...rest}
  />
);

export const Loading = () => (
  <CancelDeployment
    deployment={{id: 42}}
    {...rest}
    loading
  />
);

export const Success = () => (
  <CancelDeployment
    deployment={{id: 42}}
    {...rest}
    success
  />
);

export const Error = () => (
  <CancelDeployment
    deployment={{id: 42}}
    {...rest}
    error
  />
);
