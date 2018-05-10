// @flow

import path from 'path';
import os from 'os';
import url from 'url';
import R from 'ramda';
import { config } from './config/';
import { fileExists, readFile } from './util/fs';
import request from './util/request';
import { printErrors } from './printErrors';

type QLQueryArgs = {
  cerr: typeof console.error,
  query: string,
  variables?: Object,
  headers?: Object,
  pretty?: boolean,
};

export async function runGQLQuery({
  cerr,
  query,
  variables,
  headers: customHeaders = {},
  pretty = false,
}:
QLQueryArgs): Object {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (!headers.Authorization) {
    const tokenFile = path.join(os.homedir(), '.lagoon-token');
    const tokenFileExists = await fileExists(tokenFile);

    if (tokenFileExists) {
      const tokenBuffer = await readFile(tokenFile);
      const token = tokenBuffer.toString().replace(/(\r\n|\n|\r)/gm, '');
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const apiUrl = R.prop('api', config) || 'https://api.amazee.io/graphql';

  const {
    hostname, path: pathname, port: urlPort, protocol,
  } = url.parse(
    apiUrl,
  );

  if (hostname == null) {
    throw new Error(
      'API URL configured under the "api" key in .lagoon.yml doesn\'t contain a valid hostname.',
    );
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
      // For socket hang ups...
      R.propEq('message', 'socket hang up'),
      // ...print a nicer error message...
      R.always('Could not connect to API.'),
      // ...otherwise just return the error message
      R.prop('message'),
    )(err);
    printErrors(cerr, error);
    process.exit(1);
  }
}

export default runGQLQuery;
