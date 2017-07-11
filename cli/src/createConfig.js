// @flow

import { writeFile } from './util/fs';
import yaml from 'js-yaml';
import type { AmazeeConfig, AmazeeConfigInput } from './parseConfig';

export default function createConfig(
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
