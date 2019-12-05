import React from 'react';
import mocks, { seed } from 'api/src/mocks';
import AddTask from './index';

export default {
  component: AddTask,
  title: 'Components/AddTask',
}

seed();
const pageEnvironment = mocks.Environment();

export const Default = () => (
  <AddTask
    pageEnvironment={pageEnvironment}
  />
);

export const NoCLIService = () => (
  <AddTask
    pageEnvironment={{
      ...pageEnvironment,
      services: [],
    }}
  />
);
