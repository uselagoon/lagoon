// @flow

import { configFileInputOptionsTypes } from '../../types/ConfigFile';
import { writeConfigFile } from '../writeConfigFile';

jest.mock('../../util/fs');
const fs = require('../../util/fs');

// Flow does not know which objects are actual mocks
// this function casts given parameter to JestMockFn
const _castMockForFlow = (mockFn: any): JestMockFn<any, any> => mockFn;
const writeFileMock = _castMockForFlow(fs.writeFile);

describe('writeConfigFile', () => {
  afterEach(() => {
    writeFileMock.mockClear();
  });

  it('should write default config to given path', async () => {
    writeConfigFile('lagoon.yml', {
      project: 'your_project',
      api: '',
      ssh: '',
      token: '',
    });
    const [filename, data] = writeFileMock.mock.calls[0];

    expect(filename).toBe('lagoon.yml');
    expect(data).toMatchSnapshot();
  });

  it('should convert camelcase keys to snake case before writing config', async () => {
    // $FlowFixMe Jest can mutate exports https://stackoverflow.com/a/42979724/1268612
    configFileInputOptionsTypes.arbitraryConfigKey = String;

    // $FlowFixMe This test uses an invalid arbitrary key here on purpose
    writeConfigFile('lagoon.yml', {
      project: 'your_project',
      arbitraryConfigKey: 'asdf',
      api: '',
      ssh: '',
      token: '',
    });
    const [filename, data] = writeFileMock.mock.calls[0];

    expect(filename).toBe('lagoon.yml');
    expect(data).toMatchSnapshot();
  });
});
