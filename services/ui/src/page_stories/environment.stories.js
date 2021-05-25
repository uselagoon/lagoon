import React from 'react';
import { PageEnvironment as Environment } from '../pages/environment';

export default {
  component: Environment,
  title: 'Pages/Environment',
}

// @TODO Fix Internal Server Error on initial load.
export const Default = () => (
  <Environment
    router={{
      query: {
        openshiftProjectName: 'enhancedinfomediaries-pr-100',
      },
    }}
  />
);

export const TODO = () => (
  <p>
    The <code>Environment</code> component shows an "Internal Server Error" the
    first time it is loaded in StoryBook. Reload the page and it will appear
    properly.
  </p>
);
TODO.story = {
  name: '@TODO',
};
