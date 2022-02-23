import React from 'react';
import { getLinkData } from 'components/link/BulkDeployment';
import Breadcrumb from 'components/Breadcrumbs/Breadcrumb';

const BulkDeploymentBreadcrumb = ({ bulkIdSlug }) => {
  const linkData = getLinkData(bulkIdSlug);

  return (
    <Breadcrumb
      header="Bulk Deployment"
      title={bulkIdSlug}
      {... linkData}
    />
  );
};

export default BulkDeploymentBreadcrumb;
