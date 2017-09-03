// @flow

import { runGQLQuery } from '../../query';
import { getClientInfo } from '../client';

jest.mock('../../query');

const _mock = (mockFn: any): JestMockFn => mockFn;

const mockResponse = {
  data: {
    siteGroupByName: {
      client: {
        clientName: 'client1',
        deployPrivateKey: 'PRIVATE_KEY',
        created: 'Wed May 18 2011 00:00:00 GMT+0000 (UTC)',
        siteGroups: [{}],
        sshKeys: [
          {
            owner: 'a@example.com',
          },
        ],
      },
    },
  },
};

describe('getClientInfo', () => {
  it('should show client information', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() =>
      Promise.resolve(mockResponse),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await getClientInfo({
      sitegroup: 'some_sitegroup',
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

    const code = await getClientInfo({
      sitegroup: 'some_sitegroup',
      clog,
      cerr,
    });

    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it('should show message for non-existing sites', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() => Promise.resolve({}));

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await getClientInfo({
      sitegroup: 'some_sitegroup',
      clog,
      cerr,
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });
});
