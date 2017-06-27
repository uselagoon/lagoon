// @flow

import { asyncComponent } from 'react-async-component';

const AsyncNotFound = asyncComponent({
  resolve: () => System.import('./component'),
});

export default AsyncNotFound;
