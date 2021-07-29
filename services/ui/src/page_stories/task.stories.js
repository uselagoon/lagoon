import React from 'react';
import { PageTask as Task } from 'pages/projects/[projectSlug]/[environmentSlug]/tasks/[taskId]';

export default {
  component: Task,
  title: 'Pages/Task',
  parameters: {
    layout: 'fullscreen',
  }
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
