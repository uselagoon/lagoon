// @flow

import path from 'path';
import os from 'os';
import url from 'url';
import { readFile, doesFileExist } from './util/fs';
import request from './util/request';

type QLQueryArgs = {
  endpoint: string,
  query: string,
  variables?: Object,
  headers?: Object,
  pretty?: boolean
};

export async function runGQLQuery(args: QLQueryArgs): Promise<Object> {
  const {
    endpoint,
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
    const tokenFileExists = await doesFileExist(tokenFile);

    if (tokenFileExists) {
      const token = await readFile(tokenFile);
      headers.Authorization = `Bearer ${encodeURIComponent(token)}`;
    }
  }

  const { hostname, path: pathname, port } = url.parse(endpoint);

  if (hostname == null) {
    throw new Error('Hostname required');
  }

  const body = JSON.stringify(
    {
      query,
      variables,
    },
    null,
    pretty ? 2 : 0
  );

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
