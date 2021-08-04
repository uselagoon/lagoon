import React from 'react';
import mocks, { seed } from 'api/src/mocks';
import NavTabs from './index';

export default {
  component: NavTabs,
  title: 'Components/NavTabs',
}

seed();
const environment = mocks.Environment();

export const Default = () => (
  <NavTabs
    environment={environment}
  />
);

export const OverviewTabActive = () => (
  <NavTabs
    activeTab="overview"
    environment={environment}
  />
);

export const DeploymentsTabActive = () => (
  <NavTabs
    activeTab="deployments"
    environment={environment}
  />
);

export const BackupsTabActive = () => (
  <NavTabs
    activeTab="backups"
    environment={environment}
  />
);

export const TasksTabActive = () => (
  <NavTabs
    activeTab="tasks"
    environment={environment}
  />
);
