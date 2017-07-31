// @flow

const { createStore: createReduxStore, applyMiddleware } = require('redux');

const createSagaMiddleware = require('redux-saga').default;

const rootSaga = require('./sagas');

const reducer = require('./reducer');

import type { Store } from 'redux';
import type { Action } from './actions';
import type { RootSagaArgs } from './sagas';
import type { State } from './reducer';

export type ApiStore = Store<State, Action>;

const enhanceMiddleware = (...middleware) => {
  const remoteDevEnabled =
    process.env.REMOTE_DEV_SERVER && process.env.REMOTE_DEV_SERVER !== 'false';

  // REMOTE_DEV_SERVER is useful if we want to just run the application without jkkjj
  if (process.env.NODE_ENV === 'development' && remoteDevEnabled) {
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    const { composeWithDevTools } = require('remote-redux-devtools');
    // 'remotedev' is a container managed by docker-compose
    const composeEnhancers = composeWithDevTools({
      realtime: true,
      hostname: 'remotedev',
      port: 9090,
    });
    return composeEnhancers(applyMiddleware(...middleware));
  }

  return applyMiddleware(...middleware);
};

const createStore = (initialState: State, sagaArgs: RootSagaArgs): ApiStore => {
  const sagaMiddleware = createSagaMiddleware();

  const store = createReduxStore(reducer, enhanceMiddleware(sagaMiddleware));
  sagaMiddleware.run(rootSaga, sagaArgs);

  return store;
};

module.exports = createStore;
