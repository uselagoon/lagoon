// @flow

import type { AmazeeConfig } from '../util/config';

export type BaseArgs = {
  _: Array<string>,
  $0: string,
  config: ?AmazeeConfig,
  cwd: string,
  clog: typeof console.log,
  cerr: typeof console.error,
};
