// @flow

import { getConfig } from '../../config';
import { queryGraphQL } from '../../util/queryGraphQL';
import { handler } from '../projects';

jest.mock('../../util/queryGraphQL');
jest.mock('../../config', () => ({
  getConfig: jest.fn(() => ({ format: 'table' })),
}));

// Flow does not know which objects are actual mocks
// this function casts given parameter to JestMockFn
const _castMockForFlow = (mockFn: any): JestMockFn<any, any> => mockFn;

describe('handler', () => {
  it('should list details for multiple projects', async () => {
    _castMockForFlow(queryGraphQL).mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          allProjects: [
            {
              name: 'credentialstest-project1',
              gitUrl: 'ssh://git@172.17.0.1:2222/git/project1.git',
              branches: 'true',
              pullrequests: null,
              created: '2018-01-15 11:09:35',
            },
            {
              name: 'credentialstest-project2',
              gitUrl: 'ssh://git@172.17.0.1:2222/git/project2.git',
              branches: 'true',
              pullrequests: null,
              created: '2018-01-15 11:09:35',
            },
          ],
        },
      }),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await handler({
      clog,
      cerr,
      cwd: 'some/path',
      options: {
        format: 'table',
        token: 'token/path',
      },
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should list details for multiple projects in json format', async () => {
    _castMockForFlow(getConfig).mockImplementationOnce(() => ({
      format: 'json',
    }));

    _castMockForFlow(queryGraphQL).mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          allProjects: [
            {
              name: 'credentialstest-project1',
              gitUrl: 'ssh://git@172.17.0.1:2222/git/project1.git',
              branches: 'true',
              pullrequests: null,
              created: '2018-01-15 11:09:35',
            },
            {
              name: 'credentialstest-project2',
              gitUrl: 'ssh://git@172.17.0.1:2222/git/project2.git',
              branches: 'true',
              pullrequests: null,
              created: '2018-01-15 11:09:35',
            },
          ],
        },
      }),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await handler({
      clog,
      cerr,
      cwd: 'some/path',
      options: {
        format: 'json',
        token: 'token/path',
      },
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should list details for multiple projects in csv format', async () => {
    _castMockForFlow(getConfig).mockImplementationOnce(() => ({
      format: 'csv',
    }));

    _castMockForFlow(queryGraphQL).mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          allProjects: [
            {
              name: 'credentialstest-project1',
              gitUrl: 'ssh://git@172.17.0.1:2222/git/project1.git',
              branches: 'true',
              pullrequests: null,
              created: '2018-01-15 11:09:35',
            },
            {
              name: 'credentialstest-project2',
              gitUrl: 'ssh://git@172.17.0.1:2222/git/project2.git',
              branches: 'true',
              pullrequests: null,
              created: '2018-01-15 11:09:35',
            },
          ],
        },
      }),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await handler({
      clog,
      cerr,
      cwd: 'some/path',
      options: {
        format: 'csv',
        token: 'token/path',
      },
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should list details for multiple projects in simple format', async () => {
    _castMockForFlow(getConfig).mockImplementationOnce(() => ({
      format: 'simple',
    }));

    _castMockForFlow(queryGraphQL).mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          allProjects: [
            {
              name: 'credentialstest-project1',
              gitUrl: 'ssh://git@172.17.0.1:2222/git/project1.git',
              branches: 'true',
              pullrequests: null,
              created: '2018-01-15 11:09:35',
            },
            {
              name: 'credentialstest-project2',
              gitUrl: 'ssh://git@172.17.0.1:2222/git/project2.git',
              branches: 'true',
              pullrequests: null,
              created: '2018-01-15 11:09:35',
            },
          ],
        },
      }),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await handler({
      clog,
      cerr,
      cwd: 'some/path',
      options: {
        format: 'simple',
        token: 'token/path',
      },
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should print notice on empty projects array', async () => {
    _castMockForFlow(queryGraphQL).mockImplementationOnce(() =>
      Promise.resolve([]),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await handler({
      clog,
      cerr,
      cwd: 'some/path',
      options: {
        format: 'table',
        token: 'token/path',
      },
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should display error, if GraphQL sends error messages', async () => {
    _castMockForFlow(queryGraphQL).mockImplementationOnce(() =>
      Promise.resolve({
        errors: [{ message: 'something something error' }],
      }),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await handler({
      clog,
      cerr,
      cwd: 'some/path',
      options: {
        format: 'table',
        token: 'token/path',
      },
    });

    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });
});
