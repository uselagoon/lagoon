// @flow

import path from 'path';
import os from 'os';
import url from 'url';
import R from 'ramda';
import { fileExists, readFile } from './util/fs';
import request from './util/request';
import { printErrors } from './printErrors';

type QLQueryArgs = {
  cerr: typeof console.error,
  endpoint?: string,
  query: string,
  variables?: Object,
  headers?: Object,
  pretty?: boolean,
};

export async function runGQLQuery(args: QLQueryArgs): Object {
  const {
    cerr,
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
      const tokenBuffer = await readFile(tokenFile);
      const token = tokenBuffer.toString().replace(/(\r\n|\n|\r)/gm, '');
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const {
    hostname,
    path: pathname,
    port: urlPort,
    protocol = 'https:',
  } = url.parse(endpoint);

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
    port:
      urlPort === null
        ? R.propOr(443, protocol)(protocolPorts)
        : Number(urlPort),
    method: 'POST',
    headers,
    body,
    rejectUnauthorized: false,
  };

  try {
    return await request(options);
  } catch (err) {
    const error = R.ifElse(
      R.propEq('message', 'socket hang up'),
      // Print a nicer error message for socket hangups
      R.always('Could not connect to API.'),
      // If not a socket hang up, return the error message
      R.prop('message'),
    )(err);
    printErrors(cerr, error);
    process.exit(1);
  }
}

export default runGQLQuery;
