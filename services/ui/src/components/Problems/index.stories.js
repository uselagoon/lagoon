import React from 'react';
import Problems from './index';
import faker from 'faker/locale/en';
import mocks, { generator } from 'api/src/mocks';
import {MockList} from "graphql-tools";

export default {
  component: Problems,
  title: 'Components/Problems',
}

const problemsData = [
  {
    "id": 2,
    "identifier": "321321",
    "data": "{hello:'world'}",
    "severity": "HIGH",
    "source": "Drutiny",
    "created": "2020-04-01 15:29:22",
    "deleted": "0000-00-00 00:00:00",
    "severityScore": "0.9"
  },
  {
    "id": 1,
    "identifier": "12341234",
    "data": "{hello:'world'}",
    "severity": "LOW",
    "source": "Harbor",
    "created": "2020-04-01 15:27:53",
    "deleted": "0000-00-00 00:00:00",
    "severityScore": "0.5"
  }
];

export const Default = () => (
  <Problems problems={generator(mocks.Problem, 1, 10)} />
);

export const NoProblems = () => (
  <Problems problems={[]} />
);
