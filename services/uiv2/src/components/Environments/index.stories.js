import React from 'react';
import Environments from './index';
import mocks from 'api/src/mocks';

export default {
  component: Environments,
  title: 'Components/Environments',
  parameters: {
    layout: 'fullscreen',
  }
}

const environments = mocks.Query().allEnvironments();

export const Default = () => (
  <Environments
    environments={environments}
    display={'list'}
  />
);

export const DetailedDisplayEnvironments = () => (
  <Environments
    environments={environments}
    display={'detailed'}
  />
);