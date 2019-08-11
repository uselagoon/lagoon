// @flow

import R from 'ramda';

export type RequestOptions = {
  hostname: string,
  path?: string,
  port: number,
  protocol: 'http:' | 'https:',
  method: 'GET' | 'POST',
  headers?: Object,
  rejectUnauthorized?: boolean,
  body?: string,
};

export default function request(options: RequestOptions): Promise<Object> {
  return new Promise((resolve, reject) => {
    const { body, protocol } = options;

    const protocolModule = R.equals(protocol, 'https:')
      ? require('https')
      : require('http');

    const req = protocolModule.request(options, (res) => {
      res.setEncoding('utf8');

      let rawData = '';

      res.on('data', (chunk) => {
        rawData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    if (body) {
      req.write(body);
    }

    req.end();

    req.on('error', e => reject(e));
  });
}
