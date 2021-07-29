import React from 'react';
import mocks from 'api/src/mocks';
import AddTask from './index';

export default {
  component: AddTask,
  title: 'Components/AddTask',
  parameters: {
    layout: 'fullscreen',
  }
}

const environment = mocks.Environment();

export const Default = () => (
  <AddTask
    pageEnvironment={environment}
  />
);

export const NoCLIService = () => (
  <AddTask
    pageEnvironment={{
      ...environment,
      services: [],
    }}
  />
);
