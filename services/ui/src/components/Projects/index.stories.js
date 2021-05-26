import React from 'react';
import { Query } from '@apollo/client';
import AllProjectsQuery from 'lib/query/AllProjects';
import Projects from './index';

export default {
  component: Projects,
  title: 'Components/Projects',
};

export const Default = ({ projects }) => <Projects projects={projects} />;
Default.story = {
  decorators: [
    storyFn => (
      <Query query={AllProjectsQuery} displayName="AllProjectsQuery">
        {({data}) => storyFn({projects: data.allProjects})}
      </Query>
    ),
  ],
};

export const NoProjects = () => <Projects projects={[]} />;
