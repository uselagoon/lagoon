// @flow

import fs from 'fs';
import os from 'os';
import path from 'path';
import R from 'ramda';
import { writeFile } from '../util/fs';
import yaml from 'js-yaml';
import findup from 'findup-sync';

// TODO: Type the rest of the config
export type LagoonConfig = {|
  api?: string,
  branches?: boolean | RegExp,
  customer?: number,
  git_url?: string,
  openshift?: number,
  production_environment?: string,
  project?: string,
  pullrequests?: boolean | RegExp,
  ssh?: string,
  token?: string,
|};

export type LagoonConfigInput = {|
  project: string,
  api: string,
  ssh: string,
|};

const configInputOptionsTypes = {
  project: String,
  api: String,
  ssh: String,
  token: String,
};

export function createConfig(
  filepath: string,
  inputOptions: LagoonConfigInput,
): Promise<void> {
  const errors = [];
  const inputOptionsWithoutEmptyStrings = R.reduce(
    (acc, [optionKey, optionVal]) => {
      // Validate
      const optionType = R.prop(optionKey, configInputOptionsTypes);
      if (!optionType) {
        errors.push(
          `- Invalid config option "${optionKey}". Valid options: ${R.join(
            ', ',
            R.keys(configInputOptionsTypes),
          )}`,
        );
      } else if (!R.is(optionType, optionVal)) {
        errors.push(
          `- Invalid config option value for "${optionKey}": "${optionVal}" expected type: ${R.prop(
            'name',
            optionType,
          )}`,
        );
      }
      // Filter out empty strings
      if (!R.both(R.is(String), R.isEmpty)(optionVal)) {
        acc[optionKey] = optionVal;
      }
      return acc;
    },
    {},
    R.toPairs(inputOptions),
  );
  if (R.length(errors) > 0) throw new Error(errors.join('\n'));
  const yamlConfig = yaml.safeDump(inputOptionsWithoutEmptyStrings);
  return writeFile(filepath, yamlConfig);
}

export function parseConfig(yamlContent: string): LagoonConfig {
  // TODO: Add schema validation in here if necessary
  return yaml.safeLoad(yamlContent);
}

/**
 * Finds and reads the lagoon.yml file
 */
function readConfig(): LagoonConfig | null {
  const configPath = findup('.lagoon.yml');

  if (configPath == null) {
    return null;
  }

  const yamlContent = fs.readFileSync(configPath);
  return parseConfig(yamlContent.toString());
}

export const config = readConfig();

export const configDefaults = Object.freeze({
  token: path.join(os.homedir(), '.lagoon-token'),
});
