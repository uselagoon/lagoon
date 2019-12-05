import React from 'react';
import mocks, { seed } from 'api/src/mocks';
import Environments from './index';

export default {
  component: Environments,
  title: 'Components/Environments',
}

seed();
const data = mocks.Query().allEnvironments();

export const Default = () => (
  <Environments
    environments={data}
  />
);
