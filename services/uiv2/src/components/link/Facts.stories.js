import React from 'react';
import mocks, { seed } from 'api/src/mocks';
import FactsLink from './Facts';

export default {
  component: FactsLink,
  title: 'Components/link/FactsLink',
};

seed();
const environment = mocks.Environment();

export const Default = () => (
  <FactsLink
    environmentSlug={environment.environmentSlug}
    projectSlug={environment.project.name}
  >
    Problems link
  </FactsLink>
);
