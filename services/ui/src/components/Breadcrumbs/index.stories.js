import React from 'react';
import Breadcrumbs from './index';
import ProjectBreadcrumb from './Project';
import EnvironmentBreadcrumb from './Environment';

export default {
  component: Breadcrumbs,
  title: 'Components/Breadcrumbs',
}

export const Default = () => (
  <Breadcrumbs>
    <ProjectBreadcrumb projectSlug="fortytwo" />
  </Breadcrumbs>
);

export const WithEnvironment = () => (
  <Breadcrumbs>
    <ProjectBreadcrumb projectSlug="fortytwo" />
    <EnvironmentBreadcrumb environmentSlug="production" />
  </Breadcrumbs>
);
