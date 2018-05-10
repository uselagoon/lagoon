// @flow

import fs from 'fs';
import { writeFile } from '../util/fs';
import yaml from 'js-yaml';
import findup from 'findup-sync';

type DeployTask = {
  before_deploy: Array<string>,
  after_deploy: Array<string>,
};

// TODO: Type the rest of the config
export type AmazeeConfig = {
  api?: string,
  endpoint?: string,
  project: string,
  customer?: number,
  git_url?: string,
  openshift?: number,
  branches?: boolean | RegExp,
  pullrequests?: boolean,
  production_environment?: string,
  deploy_tasks: {
    [name: string]: DeployTask,
  },
};

export type AmazeeConfigInput = {
  project: string,
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

export function parseConfig(yamlContent: string): AmazeeConfig {
  // TODO: Add schema validation in there if necessary
  return yaml.safeLoad(yamlContent);
}

export const config = readConfig();

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
