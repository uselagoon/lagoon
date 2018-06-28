// @flow

import yargs from 'yargs';
import { printErrors } from '../printErrors';
import { visit } from './visit';

export function run() {
  try {
    // eslint-disable-next-line no-unused-expressions
    yargs
      // Use yargs.commandDir method to initialize a directory of commands
      // Ref: https://github.com/yargs/yargs/blob/e87f4873012e3541325e7ec6dafb11a93b5717e0/docs/advanced.md#commanddirdirectory-opts
      .commandDir('../commands', { visit })
      // Require entry of at least one command after `lagoon`, such as `lagoon login`.
      // `lagoon` by itself has no assigned function at the moment.
      .demandCommand()
      // .strict(): Error out on non-demanded or non-described command line argument
      // .argv: Get arguments as an object
      .strict().argv;
  } catch (err) {
    const exitCode = printErrors(
      console.error,
      { message: 'Uncaught error:' },
      err,
    );
    process.exit(exitCode);
  }
}
