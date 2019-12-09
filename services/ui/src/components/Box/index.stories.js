import React from 'react';
import Box from './index';
import Lipsum from 'storybook/components/Lipsum';

export default {
  component: Box,
  title: 'Components/Box',
};

export const Default = () => (
  <Box>
    <Lipsum />
  </Box>
);
