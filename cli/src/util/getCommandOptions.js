// @flow

import R from 'ramda';
import { globalOptions } from '../config/globalOptions';

import type { Config } from '../types/Config';

export function getCommandOptions<CommandOptionsT: { [key: string]: any }>({
  config,
  commandOptions,
}: {|
  config: Config,
  commandOptions: CommandOptionsT,
|}): { [key: $Keys<CommandOptionsT>]: any, ...$Exact<Config> } {
  // Only return the properties that match the command options
  return R.pick(
    R.concat(R.keys(globalOptions), R.keys(commandOptions)),
    config,
  );
}
