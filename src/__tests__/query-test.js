// @flow

import request from '../request';
import { Readable } from 'stream';
import { takeAsync } from 'js-csp';
import { fail } from '../util/csp';
import { fromColl } from 'js-csp/lib/csp.operations';

import { runGQLQuery } from '../query';
import { resolveChannel } from '../util/csp';

jest.mock('../request');

// Flow does not know which objects are actual mocks
// this function casts given paramter to JestMockFn
const _mock = (mockFn: any): JestMockFn => {
  return mockFn;
}

describe('runGQLQuery', () => {
  it('Should reject because of missing hostname', () => {
    const ch = runGQLQuery({
      endpoint: '',
      query: '',
    });

    return resolveChannel(ch)
      .then(value => {
        // request should not be called in that case
        const call = _mock(request).mock.calls;
        expect(call).toEqual([]);

        expect(value).toEqual(new Error('Hostname required'));
      });
  });

  it('should do a POST request ala GraphQL', () => {
    _mock(request).mockImplementationOnce(() => {
      return fromColl([{ data: 'data' }]);
    });

    const ch = runGQLQuery({
      endpoint: 'https://url.com/api',
      query: 'test',
    });

    return resolveChannel(ch)
      .then((value) => {
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
          rejectUnauthorized: false,
        });

        expect(value).toEqual({ data: 'data' });
      });
  });
});
