import React from 'react';
import ExtendedBox from './index';
import Lipsum from 'storybook/components/Lipsum';

export default {
  component: ExtendedBox,
  title: 'Components/ExtendedBox',
};

export const Default = () => (
  <ExtendedBox>
    <Lipsum />
  </ExtendedBox>
);
