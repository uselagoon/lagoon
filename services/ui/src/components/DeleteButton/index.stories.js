import React from 'react';
import { action } from '@storybook/addon-actions';
import DeleteButton from './index';

export default {
  component: DeleteButton,
  title: 'Components/Button',
};

export const Default = () => (
  <DeleteButton action={action('button-click')}>Default Button</DeleteButton>
);

export const Disabled = () => (
  <DeleteButton
    action={action('button-click')}
    disabled
  >
    Disabled Button
  </DeleteButton>
);

export const ButtonLink = () => <DeleteButton href="/">Button Link</DeleteButton>;
ButtonLink.story = {
  parameters: {
    storyDescription: '@TODO: Add "display: inline-block" to styling.',
  },
};

export const DisabledButtonLink = () => (
  <DeleteButton href="/" disabled>Button Link</DeleteButton>
);
