// @flow

import { fileExists, writeFile } from './fs';
import yaml from 'js-yaml';

import path from 'path';
import co from 'co';

type DeployTask = {
  before_deploy: Array<string>,
  after_deploy: Array<string>,
};

// TODO: Type the rest of the config
export type AmazeeConfig = {
  sitegroup: string,
  deploy_tasks: {
    [name: string]: DeployTask,
  },
};

export type AmazeeConfigInput = {
  sitegroup: string,
};

export function createConfig(
  filepath: string,
  inputOptions: AmazeeConfigInput,
): Promise<void> {
  const config: AmazeeConfig = {
    ...inputOptions,
    deploy_tasks: {
      task1: {
        before_deploy: [],
        after_deploy: [],
      },
    },
  };
  const yamlConfig = yaml.safeDump(config);
  return writeFile(filepath, yamlConfig);
}

function* walker(
  dir: string,
  filename: string,
  root: string,
): Generator<*, ?string, *> {
  let next = dir;

  while (true) {
    const full = path.join(next, filename);
    const exists = yield fileExists(full);

    if (exists) {
      return full;
    } else if (next === root) {
      // ${root}/${filename} does not exist, quit
      return null;
    }

    // Otherwise go up one level
    next = path.dirname(next);
  }
}

/**
 * Tries to resolve a given filename, starting at cwd.
 * Will try ${cwd}/$filename, if not found it will step up
 * one directory (..) until it reaches root (/${filename}).
 *
 * If no file was found, it will return null, otherwise the path
 * of the found file.
 */
export async function findConfig(
  filename: string,
  cwd: string,
): Promise<?string> {
  const start = path.join(cwd, filename);
  const { root } = path.parse(start);

  return co(walker(cwd, filename, root));
}

export function parseConfig(yamlContent: string): AmazeeConfig {
  // TODO: Add schema validation in there if necessary
  return yaml.safeLoad(yamlContent);
}
