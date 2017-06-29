// @flow

import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';

import rootSaga from './sagas';

const reducer = require('./reducer');

import type { Store } from 'redux';
import type { Action } from './actions';
import type { RootSagaArgs } from './sagas';
import type { State } from './reducer';

export type ApiStore = Store<State, Action>;

export default (initialState: State, sagaArgs: RootSagaArgs): ApiStore => {
  const sagaMiddleware = createSagaMiddleware();
  const store = createStore(reducer, applyMiddleware(sagaMiddleware));
  sagaMiddleware.run(rootSaga, sagaArgs);

  return store;
};
