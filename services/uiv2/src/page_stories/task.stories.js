import React from 'react';
import { PageTask as Task } from 'pages/projects/[projectSlug]/[environmentSlug]/tasks/[taskId]';
import EnvironmentWithTaskQuery from 'lib/query/EnvironmentWithTask';
import mocks from "api/src/mocks";

export default {
  component: Task,
  title: 'Pages/Task',
  parameters: {
    layout: 'fullscreen',
  }
}

const environment = mocks.Query().environmentWithTask({
  projectName: 'example',
  envName: 'master'
});
const environmentWithTaskQuery = [
  {
    request: {
      query: EnvironmentWithTaskQuery,
      variables: {
        // openshiftProjectName: "example-master",
        taskId: 1
      }
    },
    result: {
      data: {
        environment: environment
      }
    }
  }
];

export const task_page = () => (
  <Task router={{ query: {
    openshiftProjectName: "example-master",
    taskId: 1
  } }} />
);
task_page.parameters = {
  apolloClient: {
    mocks: environmentWithTaskQuery,
    addTypename: false
  },
};
