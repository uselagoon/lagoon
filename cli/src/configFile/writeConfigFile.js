// @flow

import yaml from 'js-yaml';
import R from 'ramda';
import toSnakeCase from 'to-snake-case';
import { writeFile } from '../util/fs';

import { configFileInputOptionsTypes } from '../types/ConfigFile';
import type { ConfigFileInput } from '../types/ConfigFile';

export function writeConfigFile(
  filepath: string,
  inputOptions: ConfigFileInput,
): Promise<void> {
  const errors = [];

  const snakeCaseInputOptionsWithoutEmptyStrings = R.reduce(
    (acc, [optionKey, optionVal]) => {
      // Validate
      const optionType = R.prop(optionKey, configFileInputOptionsTypes);

      if (!optionType) {
        errors.push(
          `- Invalid config option "${optionKey}". Valid options: ${R.join(
            ', ',
            R.keys(configFileInputOptionsTypes),
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
        acc[toSnakeCase(optionKey)] = optionVal;
      }

      return acc;
    },
    {},
    R.toPairs(inputOptions),
  );

  if (R.length(errors) > 0) throw new Error(errors.join('\n'));

  const yamlConfig = yaml.safeDump(snakeCaseInputOptionsWithoutEmptyStrings);
  return writeFile(filepath, yamlConfig);
}
