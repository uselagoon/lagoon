import React from 'react';
import { PageDeployment as Deployment } from '../pages/deployment';

export default {
  component: Deployment,
  title: 'Pages/Deployment',
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
