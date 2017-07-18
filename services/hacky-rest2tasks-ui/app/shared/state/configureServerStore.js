// @flow

import configureStore from 'state/configureStore';

export default (
  apolloClient: any,
  history: Object = {}, // req: Object = {},
): AmazeeStore<any, any> => configureStore(apolloClient, history);
