// @flow

import url from 'url';
import request from './request';
import { fail } from './util/csp';
import { chan, putAsync } from 'js-csp';

import typeof { Channel } from 'js-csp/es/impl/channels';

type QLQueryArgs = {
  endpoint: string,
  query: string,
  variables?: Object,
  headers?: Object,
  pretty?: boolean,
};

export function runGQLQuery(args: QLQueryArgs): Channel {
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

  const {
    hostname,
    path,
    port,
  } = url.parse(endpoint);

  if (hostname == null) {
    return fail('Hostname required');
  }

  const options = {
    hostname,
    path,
    port: port || 443,
    method: 'POST',
    headers,
    rejectUnauthorized: false,
  };

  const postData = JSON.stringify({
    query,
    variables,
  }, null, (pretty ? 2 : 0));

  return request(options);
}

export default runGQLQuery;
