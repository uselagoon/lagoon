// @flow

/* eslint-disable no-underscore-dangle */

import path from 'path';
import findConfig from '../findConfig';

jest.mock('../util/fs', () => {
  let _configPath: ?string;

  return ({
    lstat: (file) => {
      const found = (_configPath != null && file === _configPath);
      return Promise.resolve({ isFile: () => found });
    },
    _setup(configPath: string) {
      _configPath = configPath;
    },
    _reset() { _configPath = null; },
  });
});

// We take the risk of calling _setup / _reset without flowtype support
const fs: any = require('../util/fs');

describe('findConfig', () => {
  beforeEach(() => {
    fs._reset();
  });

  it('should find config several levels above cwd', async () => {
    fs._setup('/some/project/amazeeio.yml');
    const cwd = path.resolve('/some/project/level1/level2/level3');
    const result = await findConfig('amazeeio.yml', cwd);

    expect(result).toBe('/some/project/amazeeio.yml');
  });

  it('should start at root, check and return null', async () => {
    fs._setup('/some/project/amazeeio.yml');
    const cwd = path.resolve('/');
    const result = await findConfig('amazeeio.yml', cwd);

    expect(result).toBeNull();
  });

  it('should step through subfolders until root and return null', async () => {
    fs._setup('/some/sub/project/amazeeio.yml');
    const cwd = path.resolve('/some/sub');
    const result = await findConfig('amazeeio.yml', cwd);

    expect(result).toBeNull();
  });
});
