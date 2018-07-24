// @flow

import { queryGraphQL } from '../../util/queryGraphQL';
import { projectDetails } from '../project';

jest.mock('../../util/queryGraphQL');

const _mock = (mockFn: any): JestMockFn<any, any> => mockFn;

const mockErrorResponse = {
  errors: [{ message: 'something something error' }],
};

describe('projectDetails', () => {
  const mockResponse1 = {
    data: {
      projectByName: {
        name: 'credentialstest-project1',
        customer: {
          name: 'credentialtest-customer1',
        },
        git_url: 'project1.git',
        active_systems_deploy: 'lagoon_openshiftBuildDeploy',
        active_systems_remove: 'lagoon_openshiftRemove',
        branches: 'true',
        pullrequests: null,
        openshift: {
          name: 'credentialtest-openshift',
        },
        created: '2018-01-15 11:09:35',
      },
    },
  };

  it('should display error, if GraphQL sends error messages', async () => {
    _mock(queryGraphQL).mockImplementationOnce(() =>
      Promise.resolve(mockErrorResponse),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await projectDetails({
      clog,
      cerr,
      options: { project: 'some_project' },
    });

    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it('should show error on missing project', async () => {
    _mock(queryGraphQL).mockImplementationOnce(() => Promise.resolve({}));

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await projectDetails({
      clog,
      cerr,
      options: { project: 'not_existing' },
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should show details for given project', async () => {
    _mock(queryGraphQL).mockImplementationOnce(() =>
      Promise.resolve(mockResponse1),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await projectDetails({
      clog,
      cerr,
      options: { project: 'myproject' },
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });
});
