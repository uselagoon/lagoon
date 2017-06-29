// @flow

import request from '../util/request';

import { runGQLQuery } from '../query';

jest.mock('../util/request');

// Flow does not know which objects are actual mocks
// this function casts given paramter to JestMockFn
const _mock = (mockFn: any): JestMockFn => {
  return mockFn;
};

describe('runGQLQuery', () => {
  it('Should reject because of missing hostname', async () => {
    try {
      await runGQLQuery({
        endpoint: '',
        query: '',
      });
    }
    catch (err) {
      // request should not be called in that case
      const call = _mock(request).mock.calls;
      expect(call).toEqual([]);

      expect(err).toEqual(new Error('Hostname required'));
    }
  });

  it('should do a POST request ala GraphQL', async () => {
    _mock(request).mockImplementationOnce(() =>
      Promise.resolve({ data: 'data' }),
    );

    const result = await runGQLQuery({
      endpoint: 'https://url.com/api',
      query: 'test',
    });

    // Check if the url parsing was correct
    const call = _mock(request).mock.calls[0][0];

    expect(call).toEqual({
      hostname: 'url.com',
      path: '/api',
      port: 443,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: '{"query":"test"}',
      rejectUnauthorized: false,
    });

    expect(result).toEqual({ data: 'data' });
  });
});
