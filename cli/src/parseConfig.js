// @flow

import yaml from 'js-yaml';

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

export default function parseConfig(yamlContent: string): AmazeeConfig {
  // TODO: eventually add some SCHEMA validation in there if
  //       necessary
  return yaml.safeLoad(yamlContent);
}
