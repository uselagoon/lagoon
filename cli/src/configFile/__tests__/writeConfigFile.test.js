// @flow

import { writeConfigFile } from '../writeConfigFile';

jest.mock('../../util/fs');
const fs = require('../../util/fs');

function _mock(fn: any): JestMockFn<any, any> {
  return fn;
}

describe('writeConfigFile', () => {
  it('should write default config to given path', async () => {
    writeConfigFile('lagoon.yml', {
      project: 'your_project',
      api: '',
      ssh: '',
      token: '',
    });
    const [filename, data] = _mock(fs.writeFile).mock.calls[0];

    expect(filename).toBe('lagoon.yml');
    expect(data).toMatchSnapshot();
  });
});
