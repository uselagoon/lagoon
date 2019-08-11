// @flow

import fs from 'fs';
import findup from 'findup-sync';
import { parseConfigFile } from './parseConfigFile';

import type { ConfigFile } from '../types/ConfigFile';

/**
 * Find and read the .lagoon.yml config file
 */
export function readConfigFile(): ConfigFile | null {
  const configPath = findup('.lagoon.yml');

  if (configPath == null) {
    return null;
  }

  const yamlContent = fs.readFileSync(configPath);
  return parseConfigFile(yamlContent.toString());
}
