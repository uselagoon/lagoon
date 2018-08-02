// @flow

import yaml from 'js-yaml';

import type { ConfigFile } from '../types/ConfigFile';

export function parseConfigFile(yamlContent: string): ConfigFile {
  // TODO: Add schema validation in here if necessary
  return yaml.safeLoad(yamlContent);
}
