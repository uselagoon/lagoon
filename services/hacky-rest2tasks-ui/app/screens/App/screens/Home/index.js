// @flow

import { asyncComponent } from 'react-async-component';

const AsyncHome = asyncComponent({
  resolve: () => System.import('./component'),
});

export default AsyncHome;
