#!/usr/bin/env node

// @flow

import 'babel-polyfill';
import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { readFile } from './util/fs';
import { findConfig, parseConfig } from './util/config';
import { printErrors } from './printErrors';

import commands from './commands';

import type { AmazeeConfig } from './util/config';

/**
 * Finds and reads the amazeeio.yml file
 */
async function readConfig(cwd: string): Promise<?AmazeeConfig> {
  const configPath = await findConfig('.amazeeio.yml', cwd);

  if (configPath == null) {
    return null;
  }

  const yamlContent = await readFile(configPath);
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

export async function runCLI(cwd: string) {
  try {
    const config = await readConfig(cwd);

    // Chain together all the subcommands
    // eslint-disable-next-line no-unused-expressions
    commands
      .reduce((cmdYargs, cmd) => {
        const { name, description, run, setup } = cmd;

        const runFn = args =>
          // eslint-disable-next-line no-console
          run({ ...args, cwd, config, clog: console.log, cerr: console.error })
            .catch(err => errorQuit(err, `Uncaught error in ${name} command:`))
            .then(code => process.exit(code));

        const setupFn =
          typeof setup === 'function' ? setup : setupYargs => setupYargs;

        return cmdYargs.command(name, description, setupFn, runFn);
      }, yargs)
      .demandCommand(1)
      .strict()
      .help().argv;
  } catch (err) {
    errorQuit(err, 'Uncaught error:');
  }
}

/**
 * Look to see if the CWD is within an npm project. If it is, and that project
 * has a amazeeio CLI `npm install`ed, use that version instead of the global
 * version of the CLI.
 */
if (require.main === module) {
  const cwd = process.cwd();
  let currDir = cwd;
  let lastDir = null;
  let main = runCLI;
  while (currDir !== lastDir) {
    const localCLIPath = path.join(
      currDir,
      'node_modules',
      '.bin',
      'amazee-io-cli',
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

  main(cwd);
}
