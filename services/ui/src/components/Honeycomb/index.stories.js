import React from 'react';
import Honeycomb from './index';
import { Query } from '@apollo/client/react/components';
import AllProjectsProblemsQuery from 'lib/query/AllProjectsProblems';
import mocks, { seed } from "api/src/mocks";

export default {
  component: Honeycomb,
  title: 'Components/Honeycomb',
}

export const Default = ({projects}) => {
  return projects && <Honeycomb data={projects} filter={{showCleanProjects: false}}/>
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

export const NoProjects = () => (
  <Honeycomb data={[]} filter={{showCleanProjects: false}}/>
);
