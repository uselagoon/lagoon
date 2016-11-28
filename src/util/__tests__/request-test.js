// @flow

import request from '../request';
import { Readable } from 'stream';
import { request as httpsReq } from 'https';

jest.mock('https');

// https.request works with low level streams, this helper will
// mock a response stream
const resStream = (content: string | Object): stream$Readable => {
  const res = new Readable();
  let parsed = content;

  if (typeof parsed === 'object') {
    parsed = JSON.stringify(parsed, null, 2);
  }

  res.push(parsed);
  res.push(null);
  return res;
};

// Same for request streams
const reqStream = () => ({
  write: jest.fn(),
  end: jest.fn(),
  on: jest.fn(),
});

describe('request', () => {
  it('should do POST request with body', async () => {
    // We want to check some write() calls on that
    const req = reqStream();

    httpsReq.mockImplementationOnce((options, cb) => {
      const res = resStream({ data: 'test' });
      cb(res);

      // returns our mocked req object
      return req;
    });

    const result = await request({
      hostname: '',
      path: '',
      method: 'POST',
      headers: { some: 'header' },
      body: 'some body',
    });

    expect(result).toEqual({ data: 'test' });
  });

  it('should do GET request without body', async () => {
    // We want to check some write() calls on that
    const req = reqStream();

    httpsReq.mockImplementationOnce((options, cb) => {
      const res = resStream({ data: 'test' });
      cb(res);

      // returns our mocked req object
      return req;
    });

    const result = await request({
      hostname: '',
      path: '',
      method: 'GET',
      headers: { some: 'header' },
    });

    expect(result).toEqual({ data: 'test' });
    expect(req.write.mock.calls).toEqual([]);
  });
});
