import React from 'react';
import mocks, { seed } from 'api/src/mocks';
import TasksLink from './Tasks';

export default {
  component: TasksLink,
  title: 'Components/link/TasksLink',
};

seed();
const environment = mocks.Environment();

export const Default = () => (
  <TasksLink
    environmentSlug={environment.environmentSlug}
    projectSlug={environment.project.name}
  >
    Tasks link
  </TasksLink>
);
