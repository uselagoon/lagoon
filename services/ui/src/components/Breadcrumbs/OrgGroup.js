import React from 'react';
import { getLinkData } from 'components/link/Group';
import Breadcrumb from 'components/Breadcrumbs/Breadcrumb';

const GroupBreadcrumb = ({ groupSlug, organizationSlug, organizationName }) => {
  const linkData = getLinkData(groupSlug, organizationSlug, organizationName);

  return (
    <Breadcrumb
      header="Group"
      title={groupSlug}
      {... linkData}
    />
  );
};

export default GroupBreadcrumb;
