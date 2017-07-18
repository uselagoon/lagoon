// @flow

import React from 'react';
import { Router } from 'react-router';
import { ApolloProvider } from 'react-apollo';
import { AppContainer } from 'react-hot-loader';
import { AsyncComponentProvider } from 'react-async-component';
import renderRoutesWithData from 'routing/renderRoutesWithData';

type RootProps = {
  store: AmazeeStore<any, any>,
  routes: React.Element<any>,
  history: any,
  client: any,
};

// Get the async component state sent back by the server.
const rehydrateState = global.__ASYNC_STATE__ || {}; // eslint-disable-line no-underscore-dangle

const Root = ({
  store,
  routes,
  history,
  client,
}: RootProps): React.Element<any> => (
  <AppContainer>
    <AsyncComponentProvider rehydrateState={rehydrateState}>
      <ApolloProvider client={client} store={store}>
        <Router history={history} render={renderRoutesWithData(client, store)}>
          {routes}
        </Router>
      </ApolloProvider>
    </AsyncComponentProvider>
  </AppContainer>
);

export default Root;
