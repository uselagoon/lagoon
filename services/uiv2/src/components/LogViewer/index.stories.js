import React from 'react';
import LogViewer from './index';

export default {
  component: LogViewer,
  title: 'Components/LogViewer',
}

export const Default = () => (
  <LogViewer
    logs={'Taskem logem ipsum.'}
  />
);

export const NoLogs = () => <LogViewer />;
