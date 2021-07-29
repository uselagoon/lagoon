import React from 'react';
import { PageTasks as Tasks } from 'pages/projects/[projectSlug]/[environmentSlug]/tasks';

export default {
  component: Tasks,
  title: 'Pages/Tasks',
  parameters: {
    layout: 'fullscreen',
  }
}

export const Default = () => (
  <Tasks
    router={{
      query: {
        openshiftProjectName: 'Example'
      }
    }}
  />
);
