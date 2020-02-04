// @flow

import R from 'ramda';
import { queryGraphQL } from '../../../util/queryGraphQL';

import {
  CUSTOMER,
  OPENSHIFT,
  allOptionsSpecified,
  commandOptions,
  getAllowedCustomersAndOpenshifts,
  handler,
} from '../create';

jest.mock('../../../util/queryGraphQL');
jest.mock('../../../config', () => ({
  getConfig: jest.fn(() => ({ format: 'table' })),
}));

// Flow does not know which objects are actual mocks
// this function casts given parameter to JestMockFn
const _castMockForFlow = (mockFn: any): JestMockFn<any, any> => mockFn;

// Satisfy Flow types
const options = {
  ...R.omit([CUSTOMER, OPENSHIFT], commandOptions),
  [CUSTOMER]: 0,
  [OPENSHIFT]: 0,
};

describe('allOptionsSpecified', () => {
  it('should return true when all options are specified', () => {
    const returnVal = allOptionsSpecified(options);
    expect(returnVal).toBe(true);
  });

  it('should return true when all options and more are specified', () => {
    const returnVal = allOptionsSpecified({
      ...options,
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
    _castMockForFlow(queryGraphQL).mockImplementationOnce(() =>
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
      }),
    );

    const cerr = jest.fn();

    const returnVal = await getAllowedCustomersAndOpenshifts(cerr);

    expect(R.prop('allCustomers', returnVal)).toHaveLength(2);
    expect(R.prop('allOpenshifts', returnVal)).toHaveLength(1);
    expect(returnVal).toMatchSnapshot();
  });
});

describe('handler', () => {
  it('should display table after successful project creation', async () => {
    _castMockForFlow(queryGraphQL)
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
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: {
            addProject: {
              id: 1,
              name: 'test-project',
              customer: {
                name: 'credentialtest-customer1',
              },
              gitUrl: 'ssh://git@172.17.0.1:2222/git/project1.git',
              activeSystemsDeploy: 'lagoon_openshiftBuildDeploy',
              activeSystemsRemove: 'lagoon_openshiftRemove',
              branches: 'true',
              pullrequests: 'true',
              productionEnvironment: 'null',
              openshift: {
                name: 'credentialtest-openshift',
              },
              created: '2018-03-05 10:26:22',
            },
          },
        }),
      );

    const clog = jest.fn();
    const cerr = jest.fn();

    const returnVal = await handler({
      clog,
      cerr,
      cwd: 'some/path',
      options: {
        format: 'table',
        token: 'token/path',
        customer: 1,
        name: 'test-project',
        gitUrl: 'ssh://git@172.17.0.1:2222/git/project1.git',
        openshift: 1,
        branches: 'true',
        pullrequests: 'true',
        productionEnvironment: 'null',
      },
    });

    expect(returnVal).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it("should display error, if GraphQL sends error messages the first time it's called", async () => {
    _castMockForFlow(queryGraphQL).mockImplementationOnce(() =>
      Promise.resolve({
        errors: [{ message: 'something something error' }],
      }),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const returnVal = await handler({
      clog,
      cerr,
      cwd: 'some/path',
      options: {
        format: 'table',
        token: 'token/path',
      },
    });

    expect(returnVal).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it("should display error, if GraphQL sends error messages the second time it's called", async () => {
    _castMockForFlow(queryGraphQL)
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
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          errors: [{ message: 'something something error 2' }],
        }),
      );

    const clog = jest.fn();
    const cerr = jest.fn();

    const returnVal = await handler({
      clog,
      cerr,
      cwd: 'some/path',
      options: {
        format: 'table',
        token: 'token/path',
        customer: 1,
        name: 'test-project',
        gitUrl: 'ssh://git@172.17.0.1:2222/git/project1.git',
        openshift: 1,
        branches: 'true',
        pullrequests: 'true',
        productionEnvironment: 'null',
      },
    });

    expect(returnVal).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it('should display error, if GraphQL response contains zero customers', async () => {
    _castMockForFlow(queryGraphQL).mockImplementationOnce(() =>
      Promise.resolve({
        data: { allCustomers: [], allOpenshifts: [] },
      }),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const returnVal = await handler({
      clog,
      cerr,
      cwd: 'some/path',
      options: {
        format: 'table',
        token: 'token/path',
      },
    });

    expect(returnVal).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it('should display error, if GraphQL response contains zero openshifts but one customer', async () => {
    _castMockForFlow(queryGraphQL).mockImplementationOnce(() =>
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
      }),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const returnVal = await handler({
      clog,
      cerr,
      cwd: 'some/path',
      options: {
        format: 'table',
        token: 'token/path',
      },
    });

    expect(returnVal).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });
});
