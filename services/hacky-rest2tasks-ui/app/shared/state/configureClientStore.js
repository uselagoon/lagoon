// @flow

import configureStore from 'state/configureStore';

export default (
  apolloClient: any,
  history: Object = {},
): AmazeeStore<any, any> => {
  // eslint-disable-next-line no-underscore-dangle
  const initialState = global.__INITIAL_STATE__ || {};

  return configureStore(apolloClient, history, initialState);
};
