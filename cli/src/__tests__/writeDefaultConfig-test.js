// @flow

import writeDefaultConfig from '../writeDefaultConfig';
import { writeFile } from '../util/fs';

jest.mock('../util/fs');

function _mock(fn: any): JestMockFn {
  return fn;
}

describe('writeDefaultConfig', () => {
  it('should write default config to given path', async () => {
    writeDefaultConfig('amazeeio.yml');

    const [filename, data] = _mock(writeFile).mock.calls[0];

    expect(filename).toBe('amazeeio.yml');
    expect(data).toMatchSnapshot();
  });
});
