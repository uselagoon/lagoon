import React from 'react';
import Problems from './index';

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
    "service": "",
    "created": "2020-04-01 15:29:22",
    "deleted": "0000-00-00 00:00:00",
    "severityScore": 0.9
  },
  {
    "id": 1,
    "identifier": "12341234",
    "data": "{hello:'world'}",
    "severity": "LOW",
    "source": "Harbor",
    "service": "",
    "created": "2020-04-01 15:27:53",
    "deleted": "0000-00-00 00:00:00",
    "severityScore": 0.5
  }
];
export const Default = () => (
  <Problems problems={problemsData} />
);

export const NoProblems = () => (
  <Problems problems={[]} />
);
