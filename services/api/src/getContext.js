// @flow

import type { $Request } from 'express';
import typeof selectors from './selectors';
import type { ApiStore } from './createStore';

type Context = {
  selectors: selectors,
  store: ApiStore,
};

const getContext = (req: $Request): Context => (req.app.get('context'): any);

module.exports = getContext;
