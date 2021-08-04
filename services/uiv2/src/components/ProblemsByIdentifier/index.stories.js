import React from 'react';
import ProblemsByIdentifier from './index';
import mocks from "api/src/mocks";
import faker from "faker/locale/en";

export default {
  component: ProblemsByIdentifier,
  title: 'Components/ProblemsByIdentifier',
  parameters: {
    layout: 'fullscreen',
  }
}

export const Default = () => <ProblemsByIdentifier problems={
    Array.from({
        length: faker.random.number({
            min: 1,
            max: 10,
        }),
    }).map(() => {
      return mocks.ProblemIdentifier();
    })} />;

export const NoProblems = () => (
  <ProblemsByIdentifier problems={[]}/>
);
