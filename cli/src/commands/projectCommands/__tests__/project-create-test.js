// @flow

import R from 'ramda';
import { runGQLQuery } from '../../../query';

import {
  allOptionsSpecified,
  commandOptions,
  getAllowedCustomersAndOpenshifts,
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
              id: 1,
              name: 'credentialtest-customer1',
              comment: 'used to test the cli',
              private_key: null,
              created: '2018-02-20 19:38:11',
            },
            {
              id: 2,
              name: 'credentialtest-customer2',
              comment: 'used to test the cli',
              private_key: null,
              created: '2018-02-20 19:38:11',
            },
          ],
          allOpenshifts: [
            {
              id: 1,
              name: 'credentialtest-openshift',
              console_url: 'https://localhost:8443/',
              token: null,
              router_pattern: null,
              project_user: null,
              ssh_host: null,
              ssh_port: null,
              created: '2018-02-20 19:38:11',
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
