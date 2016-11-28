// @flow

/* eslint-disable no-underscore-dangle */

import path from 'path';
import findConfig from '../findConfig';
import { doesFileExist } from '../util/fs';

jest.mock('../util/fs');

const doesFileExistMock = (configPath: ?string) => {
  return (file: string) => {
    const found = (configPath != null && file === configPath);
    return Promise.resolve(found);
  };
};

function _mock(fn: any): JestMockFn {
  return fn;
}

describe('findConfig', () => {
  it('should find config several levels above cwd', async () => {
    _mock(doesFileExist).mockImplementation(doesFileExistMock('/some/project/amazeeio.yml'));

    const cwd = path.resolve('/some/project/level1/level2/level3');
    const result = await findConfig('amazeeio.yml', cwd);

    expect(result).toBe('/some/project/amazeeio.yml');
  });

  it('should start at root, check and return null', async () => {
    _mock(doesFileExist).mockImplementation(doesFileExistMock('/some/project/amazeeio.yml'));
    const cwd = path.resolve('/');
    const result = await findConfig('amazeeio.yml', cwd);

    expect(result).toBeNull();
  });

  it('should step through subfolders until root and return null', async () => {
    _mock(doesFileExist).mockImplementation(doesFileExistMock('/some/sub/project/amazeeio.yml'));
    const cwd = path.resolve('/some/sub');
    const result = await findConfig('amazeeio.yml', cwd);

    expect(result).toBeNull();
  });
});
