import React from 'react';
import ProblemsDashboardByProjectPageHexDisplay from 'pages/problems-dashboard-by-project-hex';
import AllProjectsProblemsQuery from 'lib/query/AllProjectsProblems';
import mocks from "api/src/mocks";

export default {
  component: ProblemsDashboardByProjectPageHexDisplay,
  title: 'Pages/ProblemsDashboard',
  parameters: {
    layout: 'fullscreen',
  }
}

const projects_problems = mocks.Query().allProjects();
const projectsProblems = [
  {
    request: {
      query: AllProjectsProblemsQuery,
      variables: {
        severity: ['CRITICAL'],
        source: [],
        envType: 'PRODUCTION'
      }
    },
    result: {
      data: {
        projectsProblems: projects_problems,
      },
    },
  },
];

//@TODO: Temp remove
export const all_problems = () => <ProblemsDashboardByProjectPageHexDisplay />;
all_problems.parameters = {
  apolloClient: {
    mocks: projectsProblems,
    addTypename: false
  },
};