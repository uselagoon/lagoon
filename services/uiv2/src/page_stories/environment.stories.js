import React from 'react';
import PageEnvironment from 'pages/projects/[projectSlug]/[environmentSlug]/index.js';
import EnvironmentByOpenshiftProjectNameQuery from 'lib/query/EnvironmentByOpenshiftProjectName';
import mocks from "api/src/mocks";

export default {
  component: PageEnvironment,
  title: 'Pages/Environment',
  parameters: {
    layout: 'fullscreen',
  }
}

const environment = mocks.Query().environmentByOpenshiftProjectName();
const environmentByOpenshiftProjectName = [
  {
    request: {
      query: EnvironmentByOpenshiftProjectNameQuery,
      // variables: { openshiftProjectName: 'enhancedinfomediaries-pr-100' }
    },
    result: {
      data: {
        environment: environment,
      },
    },
  },
];

export const environment_page = () => (
  <PageEnvironment
    router={{
      query: {
        openshiftProjectName: 'enhancedinfomediaries-pr-100',
      },
    }}
  />
);

environment_page.parameters = {
  apolloClient: {
    mocks: environmentByOpenshiftProjectName,
    addTypename: false
  },
};
