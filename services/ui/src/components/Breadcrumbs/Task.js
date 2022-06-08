import React from 'react';
import { getLinkData } from 'components/link/Task';
import Breadcrumb from 'components/Breadcrumbs/Breadcrumb';

const TaskBreadcrumb = ({ taskName, taskSlug, environmentSlug, projectSlug }) => {
  const linkData = getLinkData(taskSlug, environmentSlug, projectSlug);

  return (
    <Breadcrumb
      header="Task"
      title={taskName}
      {... linkData}
    />
  );
};

export default TaskBreadcrumb;
