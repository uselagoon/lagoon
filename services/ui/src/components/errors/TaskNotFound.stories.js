import React from 'react';
import TaskNotFound from './TaskNotFound';

export default {
  component: TaskNotFound,
  title: 'Components/Errors/TaskNotFound',
}

export const Default = () => (
  <TaskNotFound
    variables={{
      taskId: 42,
    }}
  />
);
