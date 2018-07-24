// @flow

import { queryGraphQL } from '../../util/queryGraphQL';
import { listProjects } from '../projects';

jest.mock('../../util/queryGraphQL');

const _mock = (mockFn: any): JestMockFn<any, any> => mockFn;

describe('listProjects', () => {
  it('should list details for multiple projects', async () => {
    _mock(queryGraphQL).mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          allProjects: [
            {
              name: 'credentialstest-project1',
              git_url: 'ssh://git@192.168.99.1:2222/git/project1.git',
              branches: 'true',
              pullrequests: null,
              created: '2018-01-15 11:09:35',
            },
            {
              name: 'credentialstest-project2',
              git_url: 'ssh://git@192.168.99.1:2222/git/project2.git',
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

    const code = await listProjects({
      clog,
      cerr,
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should print notice on empty projects array', async () => {
    _mock(queryGraphQL).mockImplementationOnce(() => Promise.resolve([]));

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await listProjects({
      clog,
      cerr,
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should display error, if GraphQL sends error messages', async () => {
    _mock(queryGraphQL).mockImplementationOnce(() =>
      Promise.resolve({
        errors: [{ message: 'something something error' }],
      }),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await listProjects({
      clog,
      cerr,
    });

    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });
});
