// @flow

import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'remote-redux-devtools';
import createSagaMiddleware from 'redux-saga';

import rootSaga from './sagas';

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

export default (initialState: State, sagaArgs: RootSagaArgs): ApiStore => {
  const sagaMiddleware = createSagaMiddleware();

  const store = createStore(reducer, enhanceMiddleware(sagaMiddleware));
  sagaMiddleware.run(rootSaga, sagaArgs);

  return store;
};
