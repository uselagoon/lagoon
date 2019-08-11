// @flow

import { fileExists } from '../../util/fs';
import { handler } from '../init';

jest.mock('fs');
jest.mock('../../config');
jest.mock('../../util/fs');

// Flow does not know which objects are actual mocks
// this function casts given parameter to JestMockFn
const _castMockForFlow = (mockFn: any): JestMockFn<any, any> => mockFn;

describe('handler', () => {
  // TODO: Also write a test where it bails
  it('should overwrite existing config file if overwrite option passed as true', async () => {
    _castMockForFlow(fileExists).mockImplementationOnce(() =>
      Promise.resolve(true),
    );

    const clog = jest.fn();
    const cerr = jest.fn();
    const cwd = 'some/path';

    const code = await handler({
      clog,
      cerr,
      cwd,
      options: {
        format: 'table',
        overwrite: true,
        project: 'test_project',
        api: '',
        ssh: '',
        token: '',
      },
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should not overwrite config file when `overwrite` option set to false', async () => {
    _castMockForFlow(fileExists).mockImplementationOnce(() =>
      Promise.resolve(true),
    );

    const clog = jest.fn();
    const cerr = jest.fn();
    const cwd = 'some/path';

    const code = await handler({
      clog,
      cerr,
      cwd,
      options: {
        format: 'table',
        overwrite: false,
        project: 'test_project',
        api: '',
        ssh: '',
        token: '',
      },
    });

    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it('should write default yaml to given cwd + .lagoon.yml', async () => {
    _castMockForFlow(fileExists).mockImplementationOnce(() =>
      Promise.resolve(false),
    );

    const clog = jest.fn();
    const cerr = jest.fn();
    const cwd = 'some/path';

    const code = await handler({
      clog,
      cerr,
      cwd,
      options: {
        format: 'table',
        overwrite: false,
        project: 'test_project',
        api: '',
        ssh: '',
        token: '',
      },
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });
});
