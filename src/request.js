// @flow

import https from 'https';
import { chan, putAsync } from 'js-csp';

import typeof { Channel } from 'js-csp/es/impl/channels';

export type RequestOptions = {
  hostname: string,
  path?: string,
  port?: number|string,
  method: 'POST' | 'GET',
  headers?: Object,
  rejectUnauthorized?: boolean,
  body?: string,
};

export default function request(options: RequestOptions): Channel {
  const { body } = options;

  const ch = chan();

  const req = https.request(options, (res) => {
    res.setEncoding('utf8');

    let rawData = '';
    res.on('data', chunk => { rawData += chunk; });
    res.on('end', () => {
      try {
        let parsed = JSON.parse(rawData);
        putAsync(ch, parsed);
      }
      catch (e) {
        putAsync(ch, e);
      }
    });
  });

  if (body) {
    req.write(body);
  }

  req.end();

  req.on('error', e => putAsync(ch, e));

  return ch;
}
