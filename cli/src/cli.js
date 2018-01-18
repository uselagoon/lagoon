#!/usr/bin/env node

// @flow

import 'babel-polyfill';
import fs from 'fs';
import path from 'path';
import findup from 'findup-sync';
import yargs from 'yargs';
import { parseConfig } from './util/config';
import { printErrors } from './printErrors';

import type { Argv } from 'yargs';
import type { AmazeeConfig } from './util/config';

type Yargs = typeof yargs;

export type CommandModule = {
  command: string,
  description: string,
  builder?: (yargs: Yargs) => Yargs,
  handler: (argv: Object) => Promise<number>,
};

const cwd = process.cwd();
const config = readConfig();

/**
 * Finds and reads the lagoon.yml file
 */
function readConfig(): ?AmazeeConfig {
  const configPath = findup('.lagoon.yml');

  if (configPath == null) {
    return null;
  }

  const yamlContent = fs.readFileSync(configPath);
  return parseConfig(yamlContent.toString());
}

/**
 * Used for logging unexpected errors raised by subcommands
 */
function errorQuit(err: Error | Object | string, prefix: string) {
  const exitCode = printErrors(
    // eslint-disable-next-line no-console
    console.error,
    prefix,
    err,
  );
  process.exit(exitCode);
}

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
      handler: (argv: Argv) =>
        cmd
          .handler({
            ...argv,
            cwd,
            config,
            clog: console.log,
            cerr: console.error,
          })
          .catch(err =>
            errorQuit(err, `Uncaught error in ${cmd.command} command:`))
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
      .demandCommand()
      .strict()
      .help().argv;
  } catch (err) {
    errorQuit(err, 'Uncaught error:');
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
