import React from 'react';
import mocks, { seed } from 'api/src/mocks';
import Tasks from './index';

export default {
  component: Tasks,
  title: 'Components/Tasks',
};

seed();
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
