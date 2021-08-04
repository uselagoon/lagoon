import React from 'react';
import { PageDeployment as Deployment } from 'pages/projects/[projectSlug]/[environmentSlug]/deployments/[deploymentName]';
import EnvironmentWithDeploymentQuery from 'lib/query/EnvironmentWithDeployment';
import mocks from "api/src/mocks";

export default {
  component: Deployment,
  title: 'Pages/Deployment',
  parameters: {
    layout: 'fullscreen',
  }
}

const environment = mocks.Query().environmentWithDeployment({
  projectName: 'example',
  envName: 'master'
});
const environmentWithDeploymentQuery = [
  {
    request: {
      query: EnvironmentWithDeploymentQuery,
      variables: {
        // openshiftProjectName: "example-master",
        deploymentName: 'example',
      }
    },
    result: {
      data: {
        environment: environment
      }
    }
  }
];

export const deployment_page = () => (
  <Deployment router={{ query: {
    openshiftProjectName: "example-master",
    deploymentName: 'example',
  } }} />
);
deployment_page.parameters = {
  apolloClient: {
    mocks: environmentWithDeploymentQuery,
    addTypename: false
  },
};