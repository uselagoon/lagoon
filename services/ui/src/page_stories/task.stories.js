import React from 'react';
import { PageTask as Task } from 'pages/task';

export default {
  component: Task,
  title: 'Pages/Task',
}

export const Default = () => (
  <Task
    router={{
      query: {
        openshiftProjectName: 'Example',
        taskId: 42,
      },
    }}
  />
);
