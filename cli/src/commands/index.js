// @flow

import R from 'ramda';

import type { Argv } from 'yargs';
import type { LagoonConfig } from '../config';

export type BaseHandlerArgs = {|
  argv: Argv,
  cwd: string,
  clog: typeof console.log,
  cerr: typeof console.error,
|};

export function getOptions({
  config,
  argv,
  commandOptions,
  // Dynamic options are options that will likely change every time and shouldn't be specified in the config
  dynamicOptionKeys,
}: {|
  config: ?LagoonConfig,
  argv: Argv,
  commandOptions: { [key: string]: string },
  dynamicOptionKeys?: Array<string>,
|}) {
  return (R.pick(R.keys(commandOptions))({
    // Remove options from the config that should require user input every time
    ...R.omit(dynamicOptionKeys || [], config || {}),
    ...argv,
  }): {
    [key: $Keys<typeof commandOptions>]: any,
  });
}
