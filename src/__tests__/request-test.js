// @flow

import request from '../request';
import { Readable } from 'stream';
import { request as httpsReq } from 'https';
import { resolveChannel } from '../util/csp';

jest.mock('https');

// https.request works with low level streams, this helper will
// mock a response stream
const resStream = (content: string|Object): stream$Readable => {
  const res = new Readable();
  let parsed = content;

  if (typeof parsed === 'object') {
    parsed = JSON.stringify(parsed, null, 2);
  }

  res.push(parsed);
  res.push(null);
  return res;
}

// Same for request streams
const reqStream = () => ({
  write: jest.fn(),
  end: jest.fn(),
  on: jest.fn(),
});

describe('request', () => {
  it('should do POST request with body', () => {
    // We want to check some write() calls on that
    const req = reqStream();

    httpsReq.mockImplementationOnce((options, cb) => {
      const res = resStream({ data: 'test' });
      cb(res);

      // returns our mocked req object 
      return req;
    });

    const ch = request({
      hostname: '',
      path: '',
      method: 'POST',
      headers: { some: 'header' },
      body: 'some body',
    });

    return resolveChannel(ch)
      .then(value => {
        expect(value).toEqual({ data: 'test' });
        expect(req.write.mock.calls[0][0]).toEqual('some body')
      });
  });

  it('should do GET request without body', () => {
    // We want to check some write() calls on that
    const req = reqStream();

    httpsReq.mockImplementationOnce((options, cb) => {
      const res = resStream({ data: 'test' });
      cb(res);

      // returns our mocked req object 
      return req;
    });

    const ch = request({
      hostname: '',
      path: '',
      method: 'GET',
      headers: { some: 'header' },
    });

    return resolveChannel(ch)
      .then(value => {
        expect(value).toEqual({ data: 'test' });
        expect(req.write.mock.calls).toEqual([]);
      });
  });
});
