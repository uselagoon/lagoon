// @flow

import { writeFile } from './util/fs';
import yaml from 'js-yaml';
import type { AmazeeConfig } from './parseConfig';

const DEFAULT_CONFIG: AmazeeConfig = {
  sitegroup: 'your_sitegroup',
  deploy_tasks: {
    task1: {
      before_deploy: [],
      after_deploy: [],
    },
  },
};

export default function writeDefaultConfig(filepath: string): Promise<void> {
  const str = yaml.safeDump(DEFAULT_CONFIG);
  return writeFile(filepath, str);
}
