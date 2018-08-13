// @flow

import { runGQLQuery } from '../../query';
import { getCustomerDetails } from '../customer';

jest.mock('../../query');

const _mock = (mockFn: any): JestMockFn<any, any> => mockFn;

const mockResponse = {
  data: {
    projectByName: {
      customer: {
        name: 'customer1',
        comment: 'Comment about customer1',
        private_key: 'PRIVATE_KEY',
        sshKeys: [
          {
            name: 'a@example.com',
          },
        ],
        created: 'Wed May 18 2011 00:00:00 GMT+0000 (UTC)',
      },
    },
  },
};

describe('getCustomerDetails', () => {
  it('should show customer details', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() =>
      Promise.resolve(mockResponse),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await getCustomerDetails({
      project: 'some_project',
      clog,
      cerr,
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should show error message if GraphQL returns errors', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() =>
      Promise.resolve({
        errors: [{ message: 'Something, something missing parameter X' }],
      }),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await getCustomerDetails({
      project: 'some_project',
      clog,
      cerr,
    });

    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it('should show message for non-existing projects', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() => Promise.resolve({}));

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await getCustomerDetails({
      project: 'some_project',
      clog,
      cerr,
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });
});
