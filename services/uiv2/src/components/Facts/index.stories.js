import React from 'react';
import Facts from './index';
import mocks, { generator } from 'api/src/mocks';

export default {
    component: Facts,
    title: 'Components/Facts',
    parameters: {
      layout: 'fullscreen',
    }
}

export const Default = () => (
  <Facts facts={generator(mocks.Fact, 1, 10)} />
);

export const NoFacts = () => (
  <Facts facts={[]} />
);
