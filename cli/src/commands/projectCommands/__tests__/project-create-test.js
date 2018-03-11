// @flow

import R from 'ramda';
import { runGQLQuery } from '../../../query';

import {
  allOptionsSpecified,
  commandOptions,
  getAllowedCustomersAndOpenshifts,
  createProject,
} from '../create';

jest.mock('../../../query');

const _mock = (mockFn: any): JestMockFn => mockFn;

describe('allOptionsSpecified', () => {
  it('should return true when all options are specified', () => {
    const returnVal = allOptionsSpecified(commandOptions);
    expect(returnVal).toBe(true);
  });

  it('should return true when all options and more are specified', () => {
    const returnVal = allOptionsSpecified({
      ...commandOptions,
      anotherOptionKey: 'anotherOptionValue',
    });
    expect(returnVal).toBe(true);
  });

  it('should return false if not all options are specified', () => {
    const returnVal = allOptionsSpecified({
      ...R.dissoc(R.head(R.keys(commandOptions)), commandOptions),
    });
    expect(returnVal).toBe(false);
  });
});

describe('getAllowedCustomersAndOpenshifts', () => {
  it('should return all customers and all openshifts', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          allCustomers: [
            {
              value: 1,
              name: 'credentialtest-customer1',
            },
            {
              value: 2,
              name: 'credentialtest-customer2',
            },
          ],
          allOpenshifts: [
            {
              value: 1,
              name: 'credentialtest-openshift',
            },
          ],
        },
      }));

    const cerr = jest.fn();

    const returnVal = await getAllowedCustomersAndOpenshifts(cerr);

    expect(R.prop('allCustomers', returnVal)).toHaveLength(2);
    expect(R.prop('allOpenshifts', returnVal)).toHaveLength(1);
    expect(returnVal).toMatchSnapshot();
  });
});

describe('createProject', () => {
  it('should display table after successful project creation', async () => {
    _mock(runGQLQuery)
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: {
            allCustomers: [
              {
                value: 1,
                name: 'credentialtest-customer1',
              },
              {
                value: 2,
                name: 'credentialtest-customer2',
              },
            ],
            allOpenshifts: [
              {
                value: 1,
                name: 'credentialtest-openshift',
              },
            ],
          },
        }))
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: {
            addProject: {
              id: 1,
              name: 'test-project',
              customer: {
                name: 'credentialtest-customer1',
              },
              git_url: 'ssh://git@192.168.99.1:2222/git/project1.git',
              active_systems_deploy: 'lagoon_openshiftBuildDeploy',
              active_systems_remove: 'lagoon_openshiftRemove',
              branches: true,
              pullrequests: true,
              production_environment: null,
              openshift: 1,
              created: '2018-03-05 10:26:22',
            },
          },
        }));

    const clog = jest.fn();
    const cerr = jest.fn();

    const returnVal = await createProject({
      clog,
      cerr,
      options: {
        customer: 1,
        name: 'test-project',
        git_url: 'ssh://git@192.168.99.1:2222/git/project1.git',
        openshift: 1,
        branches: 'true',
        pullrequests: 'true',
        production_environment: 'null',
      },
    });

    expect(returnVal).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it("should display error, if GraphQL sends error messages the first time it's called", async () => {
    _mock(runGQLQuery).mockImplementationOnce(() =>
      Promise.resolve({
        errors: [{ message: 'something something error' }],
      }));

    const clog = jest.fn();
    const cerr = jest.fn();

    const returnVal = await createProject({ clog, cerr, options: {} });

    expect(returnVal).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it("should display error, if GraphQL sends error messages the second time it's called", async () => {
    _mock(runGQLQuery)
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: {
            allCustomers: [
              {
                value: 1,
                name: 'credentialtest-customer1',
              },
              {
                value: 2,
                name: 'credentialtest-customer2',
              },
            ],
            allOpenshifts: [
              {
                value: 1,
                name: 'credentialtest-openshift',
              },
            ],
          },
        }))
      .mockImplementationOnce(() =>
        Promise.resolve({
          errors: [{ message: 'something something error 2' }],
        }));

    const clog = jest.fn();
    const cerr = jest.fn();

    const returnVal = await createProject({
      clog,
      cerr,
      options: {
        customer: 1,
        name: 'test-project',
        git_url: 'ssh://git@192.168.99.1:2222/git/project1.git',
        openshift: 1,
        active_systems_deploy: 'lagoon_openshiftBuildDeploy',
        active_systems_remove: 'lagoon_openshiftRemove',
        branches: 'true',
        pullrequests: 'true',
        production_environment: 'null',
      },
    });

    expect(returnVal).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it('should display error, if GraphQL response contains zero customers', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() =>
      Promise.resolve({
        data: { allCustomers: [], allOpenshifts: [] },
      }));

    const clog = jest.fn();
    const cerr = jest.fn();

    const returnVal = await createProject({ clog, cerr, options: {} });

    expect(returnVal).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it('should display error, if GraphQL response contains zero openshifts but one customer', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          allCustomers: [
            {
              value: 1,
              name: 'credentialtest-customer1',
            },
          ],
          allOpenshifts: [],
        },
      }));

    const clog = jest.fn();
    const cerr = jest.fn();

    const returnVal = await createProject({ clog, cerr, options: {} });

    expect(returnVal).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });
});
