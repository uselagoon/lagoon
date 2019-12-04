import React from 'react';
import mocks, { seed } from 'api/src/mocks';
import RestoreButton from './index';

export default {
  component: RestoreButton,
  title: 'Components/RestoreButton',
};

seed();
const backup = mocks.Backup();

export const Default = () => (
  <RestoreButton backup={{
    ...backup,
    restore: null,
  }} />
);

export const Pending = () => (
  <RestoreButton backup={{
    ...backup,
    restore: {
      ...backup.restore,
      status: 'pending',
    },
  }} />
);

export const Download = () => (
  <RestoreButton backup={{
    ...backup,
    restore: {
      ...backup.restore,
      status: 'success',
    },
  }} />
);

export const Failed = () => (
  <RestoreButton backup={{
    ...backup,
    restore: {
      ...backup.restore,
      status: 'failed',
    },
  }} />
);
