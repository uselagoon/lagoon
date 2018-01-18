// @flow

import { writeFile } from './fs';
import yaml from 'js-yaml';

type DeployTask = {
  before_deploy: Array<string>,
  after_deploy: Array<string>,
};

// TODO: Type the rest of the config
export type AmazeeConfig = {
  project: string,
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
