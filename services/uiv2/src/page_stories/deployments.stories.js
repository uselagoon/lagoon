import React from 'react';
import { PageDeployments as Deployments } from 'pages/projects/[projectSlug]/[environmentSlug]/deployments';
import EnvironmentWithDeploymentsQuery from 'lib/query/EnvironmentWithDeployments';
import mocks from "api/src/mocks";

export default {
  component: Deployments,
  title: 'Pages/Deployments',
  parameters: {
    layout: 'fullscreen',
  }
}

const environment = mocks.Query().environmentWithDeployments();
const environmentWithDeploymentsQuery = [
  {
    request: {
      query: EnvironmentWithDeploymentsQuery
    },
    result: {
      data: {
        environment: environment
      }
    }
  }
];

export const deployments_page = () => (
  <Deployments router={{ query: { openshiftProjectName: 'Example' } }} />
)
deployments_page.parameters = {
  apolloClient: {
    mocks: environmentWithDeploymentsQuery,
    addTypename: false,
    defaultOptions: { watchQuery: { fetchPolicy: 'no-cache' } }
  },
};
