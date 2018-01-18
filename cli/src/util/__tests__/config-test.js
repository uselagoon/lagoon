// @flow

import path from 'path';
import { createConfig, parseConfig } from '../config';

const fs = require('../fs');

// $FlowIgnore https://github.com/facebook/jest/issues/936#issuecomment-214556122
fs.writeFile = jest.fn();

const fileExistsMock = (configPath: ?string) => (file: string) => {
  const found = configPath != null && file === configPath;
  return Promise.resolve(found);
};

function _mock(fn: any): JestMockFn {
  return fn;
}

describe('createConfig', () => {
  it('should write default config to given path', async () => {
    createConfig('lagoon.yml', { project: 'your_project' });

    const [filename, data] = _mock(fs.writeFile).mock.calls[0];

    expect(filename).toBe('lagoon.yml');
    expect(data).toMatchSnapshot();
  });
});

describe('parseConfig', () => {
  it('should parse the config correctly', async () => {
    const yamlContent = await fs.readFile(`${__dirname}/lagoon.yml`);

    const config = parseConfig(yamlContent.toString());

    const expected = {
      project: 'amazee_io',
      deploy_tasks: {
        development: {
          before_deploy: ['cmd1', 'cmd2'],
          after_deploy: ['cmd1', 'cmd2'],
        },
        production: {
          before_deploy: ['cmd1', 'cmd2'],
          after_deploy: ['cmd1', 'cmd2'],
        },
      },
      shared: {
        production: [
          {
            src: 'files',
            dst: 'sites/default/files',
          },
        ],
      },
    };

    expect(config).toEqual(expected);
  });
});
