// @flow

import path from 'path';
import { createConfig, parseConfig } from '..';

const fs = require('../../util/fs');

// $FlowFixMe Jest can mutate exports https://github.com/facebook/jest/issues/936#issuecomment-214556122
fs.writeFile = jest.fn();

function _mock(fn: any): JestMockFn<any, any> {
  return fn;
}

describe('createConfig', () => {
  it('should write default config to given path', async () => {
    createConfig('lagoon.yml', { project: 'your_project', api: '', ssh: '' });

    const [filename, data] = _mock(fs.writeFile).mock.calls[0];

    expect(filename).toBe('lagoon.yml');
    expect(data).toMatchSnapshot();
  });
});

describe('parseConfig', () => {
  it('should parse the config correctly', async () => {
    const yamlContent = await fs.readFile(path.join(__dirname, 'lagoon.yml'));

    const config = parseConfig(yamlContent.toString());

    const expected = {
      project: 'amazee_io',
    };

    expect(config).toEqual(expected);
  });
});
