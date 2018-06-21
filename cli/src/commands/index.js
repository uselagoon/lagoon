// @flow

import type { Argv } from 'yargs';
import type { LagoonConfig } from '../config';

export type BaseHandlerArgs = {|
  argv: Argv,
  cwd: string,
  clog: typeof console.log,
  cerr: typeof console.error,
|};
