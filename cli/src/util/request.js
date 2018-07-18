// @flow

import defer from './defer';

export type RequestOptions = {
  hostname: string,
  path?: string,
  port?: number,
  method: 'POST' | 'GET',
  headers?: Object,
  rejectUnauthorized?: boolean,
  body?: string,
};

export default function request(options: RequestOptions): Promise<Object> {
  const { body, port = 443 } = options;

  const def = defer();

  const protocolModule = port === 443 ? require('https') : require('http');

  const req = protocolModule.request(options, (res) => {
    res.setEncoding('utf8');

    let rawData = '';
    res.on('data', (chunk) => {
      rawData += chunk;
    });
    res.on('end', () => {
      try {
        const parsed = JSON.parse(rawData);
        def.resolve(parsed);
      } catch (e) {
        def.reject(e);
      }
    });
  });

  if (body) {
    req.write(body);
  }

  req.end();

  req.on('error', e => def.reject(e));

  return def.promise;
}
