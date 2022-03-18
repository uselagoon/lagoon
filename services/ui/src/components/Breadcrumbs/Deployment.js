import React from 'react';
import { getLinkData } from 'components/link/Deployment';
import Breadcrumb from 'components/Breadcrumbs/Breadcrumb';

const DeploymentBreadcrumb = ({ deploymentSlug, environmentSlug, projectSlug }) => {
  const linkData = getLinkData(deploymentSlug, environmentSlug, projectSlug);

  return (
    <Breadcrumb
      header="Deployment"
      title={deploymentSlug}
      {... linkData}
    />
  );
};

export default DeploymentBreadcrumb;
