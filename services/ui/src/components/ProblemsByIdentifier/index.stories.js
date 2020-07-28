import React from 'react';
import { Query } from 'react-apollo';
import AllProblemsQuery from 'lib/query/AllProblems';
import mocks, { generator } from 'api/src/mocks';
import ProblemsByIdentifier from './index';

export default {
  component: ProblemsByIdentifier,
  title: 'Components/ProblemsByIdentifier',
}

export const Default = ({ problems }) => <ProblemsByIdentifier problems={generator(mocks.ProblemIdentifier, 1, 20)}/>;
Default.story = {
  decorators: [
    storyFn => (
      <Query query={AllProblemsQuery} displayName="AllProblemsQuery">
        {({data}) => storyFn({problems: data.problems})}
      </Query>
    ),
  ],
};

export const NoProblems = () => (
  <ProblemsByIdentifier problems={[]}/>
);
