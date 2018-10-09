// @flow

import { queryGraphQL } from '../../util/queryGraphQL';
import { handler } from '../customer';

jest.mock('../../util/queryGraphQL');
jest.mock('../../config', () => ({
  getConfig: jest.fn(() => ({ format: 'table' })),
}));

// Flow does not know which objects are actual mocks
// this function casts given parameter to JestMockFn
const _castMockForFlow = (mockFn: any): JestMockFn<any, any> => mockFn;

const mockResponse = {
  data: {
    projectByName: {
      customer: {
        name: 'customer1',
        comment: 'Comment about customer1',
        privateKey: 'PRIVATE_KEY',
        users: [
          {
            id: 0,
          },
        ],
        created: 'Wed May 18 2011 00:00:00 GMT+0000 (UTC)',
      },
    },
  },
};

describe('handler', () => {
  it('should show customer details', async () => {
    _castMockForFlow(queryGraphQL).mockImplementationOnce(() =>
      Promise.resolve(mockResponse),
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

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should show error message if GraphQL returns errors', async () => {
    _castMockForFlow(queryGraphQL).mockImplementationOnce(() =>
      Promise.resolve({
        errors: [{ message: 'Something, something missing parameter X' }],
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
        project: 'some_project',
      },
    });

    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it('should show message for non-existing projects', async () => {
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
        project: 'some_project',
      },
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });
});
