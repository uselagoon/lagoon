import React from 'react';
import { getLinkData } from 'components/link/Organization';
import Breadcrumb from 'components/Breadcrumbs/Breadcrumb';

const OrganizationBreadcrumb = ({ organizationSlug, organizationName }) => {
  const linkData = getLinkData(organizationSlug, organizationName);

  return (
    <Breadcrumb
      header="Organization"
      title={organizationName}
      {... linkData}
    />
  );
};

export default OrganizationBreadcrumb;
