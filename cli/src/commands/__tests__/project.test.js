// @flow

import { queryGraphQL } from '../../util/queryGraphQL';
import { handler } from '../project';

jest.mock('../../util/queryGraphQL');
jest.mock('../../config', () => ({
  getConfig: jest.fn(() => ({ format: 'table' })),
}));

// Flow does not know which objects are actual mocks
// this function casts given parameter to JestMockFn
const _castMockForFlow = (mockFn: any): JestMockFn<any, any> => mockFn;

const mockErrorResponse = {
  errors: [{ message: 'something something error' }],
};

describe('handler', () => {
  const mockResponse1 = {
    data: {
      projectByName: {
        name: 'credentialstest-project1',
        customer: {
          name: 'credentialtest-customer1',
        },
        gitUrl: 'project1.git',
        activeSystemsDeploy: 'lagoon_openshiftBuildDeploy',
        activeSystemsRemove: 'lagoon_openshiftRemove',
        branches: 'true',
        pullrequests: 'null',
        openshift: {
          name: 'credentialtest-openshift',
        },
        created: '2018-01-15 11:09:35',
      },
    },
  };

  it('should display error, if GraphQL sends error messages', async () => {
    _castMockForFlow(queryGraphQL).mockImplementationOnce(() =>
      Promise.resolve(mockErrorResponse),
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
        project: 'some_project',
      },
    });

    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it('should show error on missing project', async () => {
    _castMockForFlow(queryGraphQL).mockImplementationOnce(() =>
      Promise.resolve({}),
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
        project: 'not_existing',
      },
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should show details for given project', async () => {
    _castMockForFlow(queryGraphQL).mockImplementationOnce(() =>
      Promise.resolve(mockResponse1),
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
        project: 'myproject',
      },
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });
});
