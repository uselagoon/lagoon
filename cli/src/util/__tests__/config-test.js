// @flow

import path from 'path';
import { createConfig, findConfig, parseConfig } from '../config';

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
    createConfig('io.yml', { sitegroup: 'your_sitegroup' });

    const [filename, data] = _mock(fs.writeFile).mock.calls[0];

    expect(filename).toBe('io.yml');
    expect(data).toMatchSnapshot();
  });
});

describe('findConfig', () => {
  it('should find config several levels above cwd', async () => {
    // $FlowIgnore https://github.com/facebook/jest/issues/936#issuecomment-214556122
    fs.fileExists = jest
      .fn()
      .mockImplementation(fileExistsMock('/some/project/io.yml'));

    const cwd = path.resolve('/some/project/level1/level2/level3');
    const result = await findConfig('io.yml', cwd);

    expect(result).toBe('/some/project/io.yml');
  });

  it('should start at root, check and return null', async () => {
    // $FlowIgnore https://github.com/facebook/jest/issues/936#issuecomment-214556122
    fs.fileExists = jest
      .fn()
      .mockImplementation(fileExistsMock('/some/project/io.yml'));
    const cwd = path.resolve('/');
    const result = await findConfig('io.yml', cwd);

    expect(result).toBeNull();
  });

  it('should step through subfolders until root and return null', async () => {
    // $FlowIgnore https://github.com/facebook/jest/issues/936#issuecomment-214556122
    fs.fileExists = jest
      .fn()
      .mockImplementation(fileExistsMock('/some/sub/project/io.yml'));
    const cwd = path.resolve('/some/sub');
    const result = await findConfig('io.yml', cwd);

    expect(result).toBeNull();
  });
});

describe('parseConfig', () => {
  it('should parse the config correctly', async () => {
    const yamlContent = await fs.readFile(`${__dirname}/io.yml`);

    const config = parseConfig(yamlContent.toString());

    const expected = {
      sitegroup: 'amazee_io',
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
