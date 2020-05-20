import React from 'react';
import Problems from './index';
import faker from 'faker/locale/en';
import mocks, { generator } from 'api/src/mocks';
import {MockList} from "graphql-tools";

export default {
  component: Problems,
  title: 'Components/Problems',
}

let temp = mocks.ProblemMutation(mocks.Problem);

export const Default = () => (
  <Problems problems={generator(mocks.Problem, 1, 20)} />
);

export const NoProblems = () => (
  <Problems problems={[]} />
);
