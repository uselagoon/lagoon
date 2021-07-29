import React from 'react';
import mocks, { seed } from 'api/src/mocks';
import ProjectDetailsHeader from './index';

export default {
  component: ProjectDetailsHeader,
  title: 'Components/ProjectDetailsHeader',
}

seed();
const project = mocks.Project();

export const Default = () => (
  <ProjectDetailsHeader
    project={project}
  />
);
