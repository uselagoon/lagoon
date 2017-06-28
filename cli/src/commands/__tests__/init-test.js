// @flow

import { doesFileExist } from '../../util/fs';
import { run } from '../init';

jest.mock('fs');
jest.mock('../../writeDefaultConfig');
jest.mock('../../util/fs');

function _mock(fn: any): JestMockFn {
  return fn;
}

describe('run', () => {
  it('should bail on already existing config file', async () => {
    _mock(doesFileExist).mockImplementationOnce(() => Promise.resolve(true));

    const clog = jest.fn();
    const cwd = 'some/path';

    const code = await run({
      config: null,
      _: [],
      $0: '',
      cwd,
      clog,
    });

    expect(code).toBe(1);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should write default yaml to given cwd + .amazeeio.yml', async () => {
    _mock(doesFileExist).mockImplementationOnce(() => Promise.resolve(false));

    const clog = jest.fn();
    const cwd = 'some/path';

    const code = await run({
      config: null,
      _: [],
      $0: '',
      cwd,
      clog,
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });
});
