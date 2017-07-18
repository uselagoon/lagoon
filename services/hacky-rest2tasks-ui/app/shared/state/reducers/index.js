/**
 * Combine all reducers in this file and export the combined reducers. If we
 * were to do this in store.js, reducers wouldn't be hot reloadable.
 *
 * @flow
 */

import { combineReducers } from 'redux';
import routeReducer from './route';
import windowReducer from './window';

/**
 * Creates the main reducer with the asynchronously loaded ones.
 */
export default (apolloClient: any, asyncReducers?: Object): Function =>
  combineReducers({
    apollo: apolloClient.reducer(),
    route: routeReducer,
    window: windowReducer,
    ...asyncReducers,
  });
