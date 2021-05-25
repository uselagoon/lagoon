import React from 'react';
import { PageBackups as Backups } from '../pages/backups';

export default {
  component: Backups,
  title: 'Pages/Backups',
}

export const Default = () => (
  <Backups
    router={{
      query: {
        openshiftProjectName: 'Example',
      },
    }}
  />
);
