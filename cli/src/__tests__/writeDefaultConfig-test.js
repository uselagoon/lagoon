// @flow

import createConfig from '../createConfig';
import { writeFile } from '../util/fs';

jest.mock('../util/fs');

function _mock(fn: any): JestMockFn {
  return fn;
}

describe('createConfig', () => {
  it('should write default config to given path', async () => {
    createConfig('amazeeio.yml', { sitegroup: 'your_sitegroup' });

    const [filename, data] = _mock(writeFile).mock.calls[0];

    expect(filename).toBe('amazeeio.yml');
    expect(data).toMatchSnapshot();
  });
});
