#!/usr/bin/env node

// @flow

import 'babel-polyfill';
import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { readFile } from './util/fs';
import { findConfig, parseConfig } from './util/config';
import { printErrors } from './printErrors';

import type { AmazeeConfig } from './util/config';

type Yargs = typeof yargs;

export type CommandModule = {
  command: string,
  description: string,
  builder?: (yargs: Yargs) => Yargs,
  handler: (argv: Object) => Promise<number>,
};

/**
 * Finds and reads the lagoon.yml file
 */
async function readConfig(cwd: string): Promise<?AmazeeConfig> {
  const configPath = await findConfig('.lagoon.yml', cwd);

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

    // eslint-disable-next-line no-unused-expressions
    yargs
      .commandDir('commands', {
        visit(cmd: CommandModule) {
          const uncurriedCommandHandler = cmd.handler;

          // eslint-disable-next-line no-param-reassign
          cmd.handler = argv =>
            uncurriedCommandHandler({
              ...argv,
              cwd,
              config,
              clog: console.log,
              cerr: console.error,
            })
              .catch(err =>
                errorQuit(err, `Uncaught error in ${cmd.command} command:`))
              .then(code => process.exit(code));

          return cmd;
        },
      })
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
  const cwd = process.cwd();
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

  main(cwd);
}
