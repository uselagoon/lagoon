import React from 'react';
import { PageTask as Task } from '../task';

export default {
  component: Task,
  title: 'Pages/Task',
}

export const Default = () => (
  <Task
    router={{
      query: {
        openshiftProjectName: 'Example',
        taskName: 'lagoon-task-abcdef',
      },
    }}
  />
);
