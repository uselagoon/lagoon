// @flow

import { createConfig, parseConfig } from '..';

const fs = require('../../util/fs');

// $FlowFixMe Jest can mutate exports https://github.com/facebook/jest/issues/936#issuecomment-214556122
fs.writeFile = jest.fn();

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
