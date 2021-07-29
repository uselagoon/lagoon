// Import the mocked next.config before importing decorators.
import config from './next.mock-config';
import React from 'react';
// import requireContext from 'require-context.macro';
import { addDecorator } from '@storybook/react';

import { withA11y } from '@storybook/addon-a11y';
import { withKnobs } from '@storybook/addon-knobs';

import { MockedProvider } from '@apollo/client/testing';

// import withApiConnection from './decorators/ApiConnection';
import withGlobalStyles from './decorators/GlobalStyles';
import lagoonTheme from './lagoonTheme';
import '../src/static/nprogress.css';
import 'semantic-ui-css/semantic.min.css';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: { expanded: true },
  layout: 'centered',
  options: {
    theme: lagoonTheme,
    showRoots: true,
     storySort: {
      order: ['Home', 'Pages', 'Components'],
    },
  },
  apolloClient: {
    defaultOptions: { watchQuery: { fetchPolicy: 'no-cache' }, addTypename: false },
    MockedProvider
  },
  a11y: {
    restoreScroll: true,
  },
};

// Add global decorators.
// addDecorator(withA11y);
// addDecorator(withKnobs);
// addDecorator(withApiConnection);
addDecorator(withGlobalStyles);
// addDecorator(Story => <Story />);
