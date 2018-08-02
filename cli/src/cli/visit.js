// @flow

import exit from 'exit';
import { printErrors } from '../printErrors';

import typeof Yargs from 'yargs';
import type { Argv } from 'yargs';
import type { BaseHandlerArgs } from '../commands';

export type CommandModule = {
  command: string,
  description: string,
  builder?: (yargs: Yargs) => Yargs,
  handler: (handlerArgs: BaseHandlerArgs) => Promise<number>,
};

const cwd = process.cwd();

// Use the visit option (of `node-require-directory`) to provide a visitor function
// Ref: https://github.com/yargs/yargs/blob/0942a1518aad77656c135439194f8f825bd8b33a/test/command.js#L570-L599
// Ref (node-require-directory): https://github.com/troygoode/node-require-directory#visiting-objects-as-theyre-loaded
// Ref (node-require-directory): https://github.com/troygoode/node-require-directory/blob/f043664108f4a4cdb9a1c10e42268d6db754c855/test/test.js#L161-L171
export function visit(cmd: CommandModule) {
  return JSON.stringify(cmd) === '{}'
    ? // If the cmd module is an empty object, just return the object
    cmd
    : // If the cmd module isn't empty, modify the handler function by currying in some
    // parameters that we need and providing fulfillment and rejection callback
    // functions for the promise.
    {
      ...cmd,
      handler: (argv: Argv): Promise<void> =>
        cmd
          .handler({
            argv,
            cwd,
            clog: console.log,
            cerr: console.error,
          })
        // On errors, log error and then exit with a failure exit code
          .catch((err) => {
            const exitCode = printErrors(
              console.error,
              { message: `Uncaught error in ${cmd.command} command:` },
              err,
            );
            process.exit(exitCode);
          })
        // Process returned with an exit code of typically 0 (success) or 1 (failure)
          .then(code => exit(code)),
    };
}
