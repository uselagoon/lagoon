import React from 'react';
import mocks, { seed } from 'api/src/mocks';
import ProblemsLink from './Problems';

export default {
  component: ProblemsLink,
  title: 'Components/link/ProblemsLink',
};

seed();
const environment = mocks.Environment();

export const Default = () => (
  <ProblemsLink
    environmentSlug={environment.environmentSlug}
    projectSlug={environment.project.name}
  >
    Problems link
  </ProblemsLink>
);
