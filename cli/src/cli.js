#!/usr/bin/env node

// @flow

import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { printErrors } from './printErrors';

import type { Argv } from 'yargs';

type Yargs = typeof yargs;

export type CommandModule = {
  command: string,
  description: string,
  builder?: (yargs: Yargs) => Yargs,
  handler: (argv: Object) => Promise<number>,
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
        // Log out error and then exit with a failure exit code
          .catch((err) => {
            const exitCode = printErrors(
              console.error,
              `Uncaught error in ${cmd.command} command:`,
              err,
            );
            process.exit(exitCode);
          })
        // Process returned with an exit code of typically 0 (success) or 1 (failure)
          .then(code => process.exit(code)),
    };
}

export async function runCLI() {
  try {
    // eslint-disable-next-line no-unused-expressions
    yargs
      // Use yargs.commandDir method to initialize a directory of commands
      // Ref: https://github.com/yargs/yargs/blob/e87f4873012e3541325e7ec6dafb11a93b5717e0/docs/advanced.md#commanddirdirectory-opts
      .commandDir('commands', { visit })
      // Require entry of at least one command after `lagoon`, such as `lagoon login`.
      // `lagoon` by itself has no assigned function at the moment.
      .demandCommand()
      // .strict(): Error out on non-demanded or non-described command line argument
      // .argv: Get arguments as an object
      .strict().help().argv;
  } catch (err) {
    const exitCode = printErrors(console.error, 'Uncaught error:', err);
    process.exit(exitCode);
  }
}

/**
 * Look to see if the CWD is within an npm project. If it is, and that project
 * has a lagoon CLI `npm install`ed, use that version instead of the global
 * version of the CLI.
 */
if (require.main === module) {
  let currDir = cwd;
  let lastDir = null;
  let main = runCLI;

  while (currDir !== lastDir) {
    const localCLIPath = path.join(
      currDir,
      'node_modules',
      '.bin',
      'lagoon-cli',
    );
    try {
      if (fs.statSync(localCLIPath).isFile()) {
        main = require.call(null, localCLIPath).runCLI;
        break;
      }
    } catch (e) {
      // File doesn't exist, move up a dir...
    }
    lastDir = currDir;
    currDir = path.resolve(currDir, '..');
  }

  main();
}
