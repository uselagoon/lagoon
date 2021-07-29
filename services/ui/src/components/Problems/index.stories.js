import React from 'react';
import Problems from './index';
import mocks, { generator } from 'api/src/mocks';

export default {
  component: Problems,
  title: 'Components/Problems',
  parameters: {
    layout: 'fullscreen',
  }
}

export const Default = () => (
  <Problems problems={generator(mocks.Problem, 1, 20)} />
);

export const NoProblems = () => (
  <Problems problems={[]} />
);
