import React from 'react';
import Facts from './index';
import mocks, { generator } from 'api/src/mocks';

export default {
  component: Facts,
  title: 'Components/Facts',
}

export const Default = () => (
  <Facts facts={generator(mocks.Fact, 1, 20)} />
);

export const NoFacts = () => (
  <Facts facts={[]} />
);
