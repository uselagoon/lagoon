import React from 'react';
import Honeycomb from './index';
import { Query } from 'react-apollo';
import AllProjectsProblemsQuery from 'lib/query/AllProjectsProblems';

export default {
  component: Honeycomb,
  title: 'Components/Honeycomb',
}

export const Default = (projects) => {
  return projects && <Honeycomb data={projects.projects} filter={{showCleanProjects: true}}/>
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
  <Honeycomb data={[]} />
);
