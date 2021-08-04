import React from 'react';
import { PageTasks as Tasks } from 'pages/projects/[projectSlug]/[environmentSlug]/tasks';
import EnvironmentWithTasksQuery from 'lib/query/EnvironmentWithTasks';
import mocks from "api/src/mocks";

export default {
  component: Tasks,
  title: 'Pages/Tasks',
  parameters: {
    layout: 'fullscreen',
  }
}

const environment = mocks.Query().environmentWithTasks();
const environmentWithTasksQuery = [
  {
    request: {
      query: EnvironmentWithTasksQuery,
      // variables: { openshiftProjectName: 'Example' }
    },
    result: {
      data: {
        environment: environment
      }
    }
  }
];

export const tasks_page = () => (
  <Tasks router={{ query: { openshiftProjectName: 'Example' } }} />
)
tasks_page.parameters = {
  apolloClient: {
    mocks: environmentWithTasksQuery,
    addTypename: false,
    defaultOptions: { watchQuery: { fetchPolicy: 'no-cache' } }
  },
};
