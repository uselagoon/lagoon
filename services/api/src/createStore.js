// @flow

import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';

import rootSaga from './sagas';

import type { Store } from 'redux';
import type { Actions } from './actions';
import type { RootSagaArgs } from './sagas';

export type State = {
  siteGroupByFile?: {
    [filepath: string]: {
    }
  },
  siteByFile?: {
  },
};

export type ApiStore = Store<State, Actions>;

const reducer = (state, action) => {
  switch (action.type) {
    default: return state;
  }
};

export default (initialState: State, sagaArgs: RootSagaArgs): ApiStore => {
  const sagaMiddleware = createSagaMiddleware();

  const store = createStore(
    reducer,
    applyMiddleware(sagaMiddleware),
  );

  sagaMiddleware.run(rootSaga, sagaArgs);
  return store;
};
