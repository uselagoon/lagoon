// @flow

import { queryGraphQL } from '../queryGraphQL';
import request from '../request';

import * as allConfigExports from '../../config';
import * as allApiConfigExports from '../../config/getApiConfig';

jest.mock('../request');

jest.mock('../fs', () => ({
  fileExists: jest.fn(async () => true),
  readFile: jest.fn(async () => 'TOKEN'),
}));

// Flow does not know which objects are actual mocks
// this function casts given parameter to JestMockFn
const _mock = (mockFn: any): JestMockFn<any, any> => mockFn;

describe('queryGraphQL', () => {
  it('should reject because of missing hostname', async () => {
    // $FlowFixMe Jest can mutate exports https://stackoverflow.com/a/42979724/1268612
    allConfigExports.config = {
      api: 'invalid-url',
    };

    const mockedRequest = _mock(request);

    try {
      await queryGraphQL({
        cerr: jest.fn(),
        query: '',
      });
    } catch (err) {
      // request should not be called in that case
      const call = mockedRequest.mock.calls;
      expect(call).toEqual([]);

      expect(err).toEqual(
        new Error(
          'API URL configured under the "api" key in .lagoon.yml doesn\'t contain a valid hostname.',
        ),
      );
    }

    mockedRequest.mockClear();
  });

  it('should do a POST request via GraphQL', async () => {
    // $FlowFixMe Jest can mutate exports https://stackoverflow.com/a/42979724/1268612
    allConfigExports.config = null;

    const mockedRequest = _mock(request).mockImplementationOnce(() =>
      Promise.resolve({ data: 'data' }),
    );

    const result = await queryGraphQL({
      cerr: jest.fn(),
      query: 'test',
    });

    // Check if the url parsing was correct
    const call = mockedRequest.mock.calls[0][0];

    expect(call).toEqual({
      hostname: 'api.lagoon.amazeeio.cloud',
      path: '/graphql',
      port: 443,
      protocol: 'https:',
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer TOKEN',
      },
      body: '{"query":"test"}',
      rejectUnauthorized: false,
    });

    expect(result).toEqual({ data: 'data' });

    mockedRequest.mockClear();
  });

  it('should do a POST request to a custom API via GraphQL', async () => {
    // $FlowFixMe Jest can mutate exports https://stackoverflow.com/a/42979724/1268612
    allApiConfigExports.getApiConfig = () => ({
      hostname: 'www.example.com',
      port: 443,
    });

    const mockedRequest = _mock(request).mockImplementationOnce(() =>
      Promise.resolve({ data: 'data' }),
    );

    const result = await queryGraphQL({
      cerr: jest.fn(),
      query: 'test',
    });

    // Check if the url parsing was correct
    const call = mockedRequest.mock.calls[0][0];

    expect(call).toEqual({
      hostname: 'www.example.com',
      path: '/graphql',
      port: 443,
      protocol: 'https:',
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer TOKEN',
      },
      body: '{"query":"test"}',
      rejectUnauthorized: false,
    });

    expect(result).toEqual({ data: 'data' });
    mockedRequest.mockClear();
  });
});
