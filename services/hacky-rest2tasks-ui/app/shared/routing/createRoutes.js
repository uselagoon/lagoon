// @flow

import React from 'react';
import { Route, IndexRoute } from 'react-router';
import App from 'App';
import Home from 'App/screens/Home';

const createRoutes = (): React.Element<any> => (
  <Route component={App} path="/">
    <IndexRoute component={Home} />
  </Route>
);

export default createRoutes;
