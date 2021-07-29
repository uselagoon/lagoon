import React from 'react';
import Honeycomb from './index';
import AllProjectsProblemsQuery from 'lib/query/AllProjectsProblems';
import mocks from "api/src/mocks";

export default {
  component: Honeycomb,
  title: 'Components/Honeycomb',
  parameters: {
    layout: 'fullscreen',
  }
}

const projects = {projectsProblems: mocks.Query().allProjects() };
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
        projectsProblems: projects,
      },
    },
  },
];

export const Default = () => {
  return <Honeycomb data={projects} filter={{showCleanProjects: false}}/>
};
Default.parameters = {
  apolloClient: {
    mocks: projectsProblems,
    addTypename: false
  },
};

export const NoProjects = () => (
  <Honeycomb data={[]} filter={{showCleanProjects: false}}/>
);
