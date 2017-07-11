// @flow

import path from 'path';
import os from 'os';
import url from 'url';
import R from 'ramda';
import { fileExists, readFile } from './util/fs';
import request from './util/request';

type QLQueryArgs = {
  endpoint?: string,
  query: string,
  variables?: Object,
  headers?: Object,
  pretty?: boolean,
};

export async function runGQLQuery(args: QLQueryArgs): Promise<Object> {
  const {
    endpoint = process.env.API_URL || 'https://api.amazee.io/graphql',
    query,
    variables,
    headers: customHeaders = {},
    pretty = false,
  } = args;

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (!headers.Authorization) {
    const tokenFile = path.join(os.homedir(), '.ioauth');
    const tokenFileExists = await fileExists(tokenFile);

    if (tokenFileExists) {
      const token = await readFile(tokenFile);
      headers.Authorization = `Bearer ${encodeURIComponent(token.toString())}`;
    }
  }

  const { hostname, path: pathname, port: urlPort, protocol = 'https:' } = url.parse(endpoint);

  if (hostname == null) {
    throw new Error('Hostname required');
  }

  const body = JSON.stringify(
    {
      query,
      variables,
    },
    null,
    pretty ? 2 : 0,
  );

  const protocolPorts = {
    'https:': 443,
    'http:': 80,
  };

  const options = {
    hostname,
    path: pathname,
    port: urlPort === null ? R.propOr(443, protocol)(protocolPorts) : Number(urlPort),
    method: 'POST',
    headers,
    body,
    rejectUnauthorized: false,
  };

  return request(options);
}

export default runGQLQuery;
