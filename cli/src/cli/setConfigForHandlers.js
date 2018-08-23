// @flow

import exit from 'exit';
import R from 'ramda';
import { setConfig } from '../config';
import { getCommandOptions } from '../util/getCommandOptions';
import { printErrors } from '../util/printErrors';

import typeof Yargs from 'yargs';
import type { Argv } from 'yargs';
import type { CommandHandlerArgs } from '../types/Command';

export type CommandModule = {
  command: string,
  commandOptions: { [key: string]: string },
  dynamicOptionsKeys: Array<string>,
  description: string,
  builder?: (yargs: Yargs) => Yargs,
  handler: (handlerArgs: CommandHandlerArgs) => Promise<number>,
};

const cwd = process.cwd();

// Use the visit option (of `node-require-directory`) to provide a visitor function
// Ref: https://github.com/yargs/yargs/blob/0942a1518aad77656c135439194f8f825bd8b33a/test/command.js#L570-L599
// Ref (node-require-directory): https://github.com/troygoode/node-require-directory#visiting-objects-as-theyre-loaded
// Ref (node-require-directory): https://github.com/troygoode/node-require-directory/blob/f043664108f4a4cdb9a1c10e42268d6db754c855/test/test.js#L161-L171
export function setConfigForHandlers(cmd: CommandModule) {
  return JSON.stringify(cmd) === '{}'
    ? // If the cmd module is an empty object, just return the object
    cmd
    : // If the cmd module isn't empty, modify the handler function by currying in some
    // parameters that we need and providing fulfillment and rejection callback
    // functions for the promise.
    {
      ...cmd,
      handler: (argv: Argv): Promise<void> => {
        const config = setConfig({
          argv,
          dynamicOptionsKeys: R.prop('dynamicOptionsKeys', cmd),
        });

        const options = getCommandOptions({
          config,
          commandOptions: R.prop('commandOptions', cmd),
        });

        return (
          cmd
            .handler({
              options,
              cwd,
              clog: console.log,
              cerr: console.error,
            })
        // On errors, log error and then exit with a failure exit code
            .catch((err) => {
              const exitCode = printErrors(
                console.error,
                `Uncaught error in ${cmd.command} command:`,
                err,
              );
              process.exit(exitCode);
            })
        // Process returned with an exit code of typically 0 (success) or 1 (failure)
            .then(code => exit(code))
        );
      },
    };
}
