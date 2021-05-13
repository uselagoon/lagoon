import React from 'react';
import Route from './index';
import mocks, { seed } from 'api/src/mocks';

export default {
  component: Route,
  title: 'Components/Route',
}

seed();
const data = mocks.Environment();

export const Default = () => (
  <Route environment={data} />
);

export const NoRoute = () => (
  <Route environment={[]} />
);
