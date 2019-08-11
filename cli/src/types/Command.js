// @flow

import type { Config } from './Config';

export type CommandHandlerArgs = {
  options: Config,
  cwd: string,
  clog: typeof console.log,
  cerr: typeof console.error,
};

export type CommandHandlerArgsWithOptions<CommandConfig> = {
  ...$Exact<CommandHandlerArgs>,
  options: {|
    ...$Exact<$PropertyType<CommandHandlerArgs, 'options'>>,
    ...$Exact<CommandConfig>,
  |},
};
