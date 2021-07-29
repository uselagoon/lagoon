import React from 'react';
import { PageFacts as Facts } from 'pages/projects/[projectSlug]/[environmentSlug]/facts';

export default {
  component: Facts,
  title: 'Pages/Facts',
  parameters: {
    layout: 'fullscreen',
  }
}

export const Default = () => (
  <Facts
    router={{
      query: {
        openshiftProjectName: 'Example',
        taskId: 42,
      },
    }}
  />
);
