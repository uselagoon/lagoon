import React from 'react';
import { getLinkData } from 'components/link/Project';
import Breadcrumb from 'components/Breadcrumbs/Breadcrumb';

const ProjectBreadcrumb = ({ projectSlug }) => {
  const linkData = getLinkData(projectSlug);

  return (
    <Breadcrumb
      header="Project"
      title={projectSlug}
      {... linkData}
    />
  );
};

export default ProjectBreadcrumb;
