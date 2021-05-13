import React from 'react';
import { PageFacts as Facts } from '../facts';

export default {
  component: Facts,
  title: 'Pages/Facts',
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
