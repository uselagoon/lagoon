import React, { useState } from 'react';
import { bp, color, fontSize } from 'lib/variables';
import Breadcrumbs from 'components/Breadcrumbs';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';
import EnvironmentBreadcrumb from 'components/Breadcrumbs/Environment';

const EnvironmentHeader = ({ environment }) => {
  if (!environment) {
    return null;
  }

  return (
    <div className="environment-header">
      {/* <div>{environment.project.name} / {environment.name}   <span>...</span></div> */}

       <Breadcrumbs>
        <ProjectBreadcrumb projectSlug={environment.project.name} />
        <EnvironmentBreadcrumb
          environmentSlug={environment.openshiftProjectName}
          projectSlug={environment.project.name}
        />
      </Breadcrumbs>
      <style jsx>{`
        .environment-header {
        }
      `}</style>
    </div>
  );
};

export default EnvironmentHeader;