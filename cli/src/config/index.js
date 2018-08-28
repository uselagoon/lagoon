// @flow

import R from 'ramda';
import { readConfigFile } from '../configFile/readConfigFile';
import { globalOptionDefaults } from './globalOptions';

import type { Argv } from 'yargs';
import type { Config } from '../types/Config';

let argv = {};

export const getConfig = (() => {
  let config;

  return ({
    // Dynamic options are options that will likely change every time and should only be specified dynamically.
    // Example: the --overwrite option is allowed to be passed as a command line option, but not allowed to be saved in and read from the config file
    // Example: the --token <path> option is allowed to be passed as a command line option and environment variable, but not allowed to be read from the config file
    dynamicOptionsKeys,
  }: {
    dynamicOptionsKeys?: Array<string>,
  } = {}): Config => {
    if (!config) {
      if (R.isEmpty(argv)) {
        throw new Error(
          'getConfig() called before argv initialized (setConfig() not yet called?)',
        );
      }
      config = Object.freeze({
        // Manually apply defaults instead of using yargs' `default` option in order to allow config file to override global defaults
        // An alternative would be to move everything into yargs (global options, command options, config using yargs.config, environment variables using yargs.env), but this doesn't allow us an easy way to filter out values from only some sources later with the dynamicOptionsKeys option./
        // Maybe just add an option to filter the configFile to readConfigFile?
        ...globalOptionDefaults,
        ...R.omit(dynamicOptionsKeys || [], readConfigFile() || {}),
        ...argv,
      });
    }

    return config;
  };
})();

export function setConfig({
  argv: newArgv,
  dynamicOptionsKeys,
}: {
  argv: Argv,
  dynamicOptionsKeys: Array<string>,
}): Config {
  // Omit yargs-specific properties
  argv = R.omit(['_', '$0'], newArgv);
  return getConfig({ dynamicOptionsKeys });
}
