import React from 'react';
import { getLinkData } from 'components/link/OrgProjectGroup';
import Breadcrumb from 'components/Breadcrumbs/Breadcrumb';

const OrgProjectBreadcrumb = ({ projectSlug, organizationSlug, organizationName }) => {
  const linkData = getLinkData(projectSlug, organizationSlug, organizationName);

  return (
    <Breadcrumb
      header="Project"
      title={projectSlug}
      {... linkData}
    />
  );
};

export default OrgProjectBreadcrumb;
