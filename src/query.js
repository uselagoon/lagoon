// @flow

import url from 'url';
import { request } from 'https';
import { chan, putAsync } from 'js-csp';

type Args = {
  endpoint: string,
  query: string,
  variables?: Object,
  headers?: Object,
  pretty?: boolean,
};

type Channel = any;

export default function runGQLQuery(args: Args): Channel {
  const {
    endpoint,
    query,
    variables,
    headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    pretty = false,
  } = args;

  const ch = chan();
  const { hostname, path, port } = url.parse(endpoint);

  const options = {
    hostname,
    path,
    port,
    method: 'POST',
    headers,
    rejectUnauthorized: false,
  };

  const postData = JSON.stringify({
    query,
    variables,
  }, null, (pretty ? 2 : 0));

  const req = request(options, (res) => {
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

  req.write(postData);
  req.end();

  req.on('error', e => putAsync(ch, e));

  return ch;
}
