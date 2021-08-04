import React from 'react';
import mocks, { seed } from 'api/src/mocks';
import Task from './index';

export default {
  component: Task,
  title: 'Components/Task',
};

seed();
const task = mocks.Task();

export const Active = () => (
  <Task task={{
    ...task,
    status: 'active',
  }} />
);

export const Succeeded = () => (
  <Task task={{
    ...task,
    status: 'succeeded',
  }} />
);

export const Failed = () => (
  <Task task={{
    ...task,
    status: 'failed',
  }} />
);

export const NoFiles = () => (
  <Task task={{
    ...task,
    files: [],
  }} />
);
