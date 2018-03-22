// @flow

import { runGQLQuery } from '../../query';
import { projectDetails } from '../project';

jest.mock('../../query');

const _mock = (mockFn: any): JestMockFn => mockFn;

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
    _mock(runGQLQuery).mockImplementationOnce(() =>
      Promise.resolve(mockErrorResponse));

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await projectDetails({
      projectName: 'some_project',
      clog,
      cerr,
    });

    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it('should show error on missing project', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() => Promise.resolve({}));

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await projectDetails({
      projectName: 'not_existing',
      clog,
      cerr,
    });

    expect(code).toBe(1);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should show details for given project', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() =>
      Promise.resolve(mockResponse1));

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await projectDetails({
      projectName: 'myproject',
      clog,
      cerr,
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });
});
