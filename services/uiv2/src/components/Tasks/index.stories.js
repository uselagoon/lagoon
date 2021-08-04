import React from 'react';
import Tasks from './index';
import mocks from 'api/src/mocks';

export default {
  component: Tasks,
  title: 'Components/Tasks',
  parameters: {
    layout: 'fullscreen'
  }
};

const environment = mocks.Environment();
const tasks = [
  mocks.Task(null, {environment}),
  mocks.Task(null, {environment}),
  mocks.Task(null, {environment}),
  mocks.Task(null, {environment}),
  mocks.Task(null, {environment}),
];

export const Default = () => <Tasks tasks={tasks} />;

export const NoTasks = () => <Tasks tasks={[]} />;
