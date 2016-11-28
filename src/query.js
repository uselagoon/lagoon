// @flow

import url from 'url';
import request from './util/request';

type QLQueryArgs = {
  endpoint: string,
  query: string,
  variables?: Object,
  headers?: Object,
  pretty?: boolean,
};

export async function runGQLQuery(args: QLQueryArgs): Promise<Object> {
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
    throw new Error('Hostname required');
  }

  const body = JSON.stringify({
    query,
    variables,
  }, null, (pretty ? 2 : 0));

  const options = {
    hostname,
    path,
    port: port || 443,
    method: 'POST',
    headers,
    body,
    rejectUnauthorized: false,
  };

  return request(options);
}

export default runGQLQuery;
