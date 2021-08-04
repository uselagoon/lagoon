import React from 'react';
import StatusLayout from './index';
import Lipsum from 'storybook/components/Lipsum';

export default {
  component: StatusLayout,
  title: 'Components/Layouts/Status Layout',
}

export const Default = () => (
  <StatusLayout>
    <Lipsum />
  </StatusLayout>
);
