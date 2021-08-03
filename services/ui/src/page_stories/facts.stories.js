import React from 'react';
import { PageFacts as Facts } from 'pages/projects/[projectSlug]/[environmentSlug]/facts';
import EnvironmentWithFactsQuery from 'lib/query/EnvironmentWithFacts';
import mocks from "api/src/mocks";

export default {
  component: Facts,
  title: 'Pages/Facts',
  parameters: {
    layout: 'fullscreen',
  }
}

const environment = mocks.Query().environmentWithFacts();
const environmentWithFactsQuery = [
  {
    request: {
      query: EnvironmentWithFactsQuery
    },
    result: {
      data: {
        environment: environment
      }
    }
  }
];

export const facts_page = () => (
  <Facts router={{ query: { openshiftProjectName: 'Example', taskId: 42 } }} />
)
facts_page.parameters = {
  apolloClient: {
    mocks: environmentWithFactsQuery,
    addTypename: false
  },
};