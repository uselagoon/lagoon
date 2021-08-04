import React from 'react';
import { action } from '@storybook/addon-actions';
import Button from './index';

export default {
  component: Button,
  title: 'Components/Button',
};

export const Default = () => (
  <Button action={action('button-click')}>Default Button</Button>
);

export const Disabled = () => (
  <Button
    action={action('button-click')}
    disabled
  >
    Disabled Button
  </Button>
);

export const ButtonLink = () => <Button href="/">Button Link</Button>;
ButtonLink.story = {
  parameters: {
    storyDescription: '@TODO: Add "display: inline-block" to styling.',
  },
};

export const DisabledButtonLink = () => (
  <Button href="/" disabled>Button Link</Button>
);
