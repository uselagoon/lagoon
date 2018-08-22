// @flow

import { writeConfigFile } from '../writeConfigFile';

jest.mock('../../util/fs');
const fs = require('../../util/fs');

// Flow does not know which objects are actual mocks
// this function casts given parameter to JestMockFn
const _castMockForFlow = (mockFn: any): JestMockFn<any, any> => mockFn;

describe('writeConfigFile', () => {
  it('should write default config to given path', async () => {
    writeConfigFile('lagoon.yml', {
      project: 'your_project',
      api: '',
      ssh: '',
      token: '',
    });
    const [filename, data] = _castMockForFlow(fs.writeFile).mock.calls[0];

    expect(filename).toBe('lagoon.yml');
    expect(data).toMatchSnapshot();
  });
});
