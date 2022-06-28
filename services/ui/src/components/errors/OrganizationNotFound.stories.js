import React from 'react';
import ProjectNotFound from './ProjectNotFound';

export default {
  component: ProjectNotFound,
  title: 'Components/Errors/ProjectNotFound',
}

export const Default = () => (
  <ProjectNotFound
    variables={{
      name: 'fortytwo',
    }}
  />
);
