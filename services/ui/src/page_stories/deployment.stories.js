import React from 'react';
import { PageDeployment as Deployment } from 'pages/projects/[projectSlug]/[environmentSlug]/deployments/[deploymentName]';

export default {
  component: Deployment,
  title: 'Pages/Deployment',
  parameters: {
    layout: 'fullscreen',
  }
}

export const Default = () => (
  <Deployment
    router={{
      query: {
        openshiftProjectName: 'Example',
        deploymentName: 'example',
      },
    }}
  />
);
