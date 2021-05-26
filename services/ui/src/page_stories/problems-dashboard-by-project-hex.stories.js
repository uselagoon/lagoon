import React from 'react';
import ProblemsDashboardByProjectPageHexDisplay from '../pages/problems-dashboard-by-project-hex';
import { Query } from "@apollo/client";
import AllProjectsProblemsQuery from 'lib/query/AllProjectsProblems';
import ApiConnection from "lib/ApiConnection";

export default {
  component: ProblemsDashboardByProjectPageHexDisplay,
  title: 'Pages/HexDashboard',
}

export const Default = (projects) => {
  return (projects &&
    <ApiConnection>
        <ProblemsDashboardByProjectPageHexDisplay data={projects} />
    </ApiConnection>
  );
};

Default.story = {
  decorators: [
    storyFn => (
      <Query query={AllProjectsProblemsQuery} displayName="AllProjectsProblemsQuery">
        {({data: projectsProblems}) => projectsProblems && storyFn({projects: projectsProblems})}
      </Query>
    ),
  ],
};