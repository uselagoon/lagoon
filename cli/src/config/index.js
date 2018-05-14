// @flow

import fs from 'fs';
import { writeFile } from '../util/fs';
import yaml from 'js-yaml';
import findup from 'findup-sync';

// TODO: Type the rest of the config
export type LagoonConfig = {
  api?: string,
  ssh?: string,
  project: string,
  customer?: number,
  git_url?: string,
  openshift?: number,
  branches?: boolean | RegExp,
  pullrequests?: boolean,
  production_environment?: string,
};

export type LagoonConfigInput = {
  project: string,
};

export function createConfig(
  filepath: string,
  inputOptions: LagoonConfigInput,
): Promise<void> {
  const config: LagoonConfig = {
    ...inputOptions,
  };
  const yamlConfig = yaml.safeDump(config);
  return writeFile(filepath, yamlConfig);
}

export function parseConfig(yamlContent: string): LagoonConfig {
  // TODO: Add schema validation in there if necessary
  return yaml.safeLoad(yamlContent);
}

export const config = readConfig();

/**
 * Finds and reads the lagoon.yml file
 */
function readConfig(): ?LagoonConfig {
  const configPath = findup('.lagoon.yml');

  if (configPath == null) {
    return null;
  }

  const yamlContent = fs.readFileSync(configPath);
  return parseConfig(yamlContent.toString());
}
