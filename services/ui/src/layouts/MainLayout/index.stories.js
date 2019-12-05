import React from 'react';
import MainLayout from './index';
import Lipsum from 'storybook/components/Lipsum';

export default {
  component: MainLayout,
  title: 'Components/Layouts/Main Layout',
}

export const Default = () => (
  <MainLayout>
    <Lipsum />
  </MainLayout>
);
