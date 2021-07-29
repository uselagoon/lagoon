import React from 'react';
import Backups from './index';

export default {
  component: Backups,
  title: 'Components/Backups',
  parameters: {
    layout: 'fullscreen',
  }
}

const backupsData = [
  {
    source: 'mariadb',
    created: '2019-11-18T08:00:00',
    backupId: '40',
    restore: {
      status: 'completed',
      restoreLocation: 'https://example.com/backup',
    },
  },
  {
    source: 'mariadb',
    created: '2019-11-19T08:00:00',
    backupId: '41',
    restore: {
      status: 'failed',
    },
  },
  {
    source: 'mariadb',
    created: '2019-11-19T09:00:00',
    backupId: '42',
    restore: {
      status: 'pending',
    },
  },
];
export const Default = () => (
  <Backups backups={backupsData} />
);

export const NoBackups = () => (
  <Backups backups={[]} />
);
