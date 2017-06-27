// @flow

import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'react-router-redux';
import type { Store } from 'redux';
import createReducer from './reducers';

export const injectAsyncReducer = (
  store: AmazeeStore<any, any>,
  name: string,
  asyncReducer: Object,
): void => {
  store.asyncReducers[name] = asyncReducer; // eslint-disable-line
  store.replaceReducer(createReducer(store.apolloClient, store.asyncReducers));
};

const configureStore = (
  apolloClient: any,
  history: any,
  initialState?: any = {},
): AmazeeStore<any, any> => {
  const middlewares: Array<Function> = [
    routerMiddleware(history),
    apolloClient.middleware(),
  ];

  const enhancers: Array<Function> = [applyMiddleware(...middlewares)];

  if (__DEVELOPMENT__) {
    const devToolsExtension =
      (__CLIENT__ && global.devToolsExtension) ||
      (() => (noop: any): any => noop);

    enhancers.push(devToolsExtension());
  }

  // Make sure that the apollo state is initialized.
  const initialStateFinal = {
    ...initialState,
    apollo: initialState.apollo || {},
  };

  // Create the store with the enhancers.
  const store: Store<any, any> = createStore(
    createReducer(apolloClient),
    initialStateFinal,
    compose(...enhancers),
  );

  // Make reducers hot reloadable.
  if (
    module.hot &&
    module.hot.accept &&
    typeof module.hot.accept === 'function'
  ) {
    module.hot.accept('./reducers', (): void => {
      const nextRootReducer: Object = require('./reducers').default; // eslint-disable-line global-require
      store.replaceReducer(nextRootReducer);
    });
  }

  // Extend the store with asynchronous reducers.
  const extendedStore: AmazeeStore<any, any> = {
    ...store,
    asyncReducers: {},
    apolloClient,
  };

  return extendedStore;
};

export default configureStore;
