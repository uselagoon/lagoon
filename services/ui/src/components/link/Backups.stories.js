import React from 'react';
import mocks, { seed } from 'api/src/mocks';
import BackupsLink from './Backups';

export default {
  component: BackupsLink,
  title: 'Components/link/BackupsLink',
};

seed();
const environment = mocks.Environment();

export const Default = () => (
  <BackupsLink
    environmentSlug={environment.openshiftProjectName}
    projectSlug={environment.project.name}
  >
    Backups link
  </BackupsLink>
);
