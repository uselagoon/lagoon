import React from 'react';
import { getLinkData } from 'components/link/Environment';
import Breadcrumb from 'components/Breadcrumbs/Breadcrumb';

const EnvironmentBreadcrumb = ({ environmentSlug, projectSlug }) => {
  const linkData = getLinkData(environmentSlug, projectSlug);

  return (
    <Breadcrumb
      header="Environment"
      title={environmentSlug}
      {... linkData}
    />
  );
};

export default EnvironmentBreadcrumb;
