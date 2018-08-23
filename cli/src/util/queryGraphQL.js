// @flow

import R from 'ramda';
import { getConfig } from '../config';
import { getApiConfig } from '../config/getApiConfig';
import { fileExists, readFile } from './fs';
import request from './request';
import { printErrors } from './printErrors';

type QLQueryArgs = {
  cerr: typeof console.error,
  query: string,
  variables?: Object,
  headers?: Object,
  pretty?: boolean,
};

export async function queryGraphQL({
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
    const tokenFile = R.prop('token', getConfig());
    const tokenFileExists = await fileExists(tokenFile);

    if (tokenFileExists) {
      const tokenBuffer = await readFile(tokenFile);
      const token = tokenBuffer.toString().replace(/(\r\n|\n|\r)/gm, '');
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const { hostname, port } = getApiConfig();

  const protocol = R.equals(port, 443) ? 'https:' : 'http:';

  const options = {
    hostname,
    path: '/graphql',
    port,
    protocol,
    method: 'POST',
    headers,
    body: JSON.stringify(
      {
        query,
        variables,
      },
      null,
      pretty ? 2 : 0,
    ),
    rejectUnauthorized: false,
  };

  let response;

  try {
    response = await request(options);
  } catch (err) {
    const error = R.ifElse(
      // For socket hang ups...
      R.propEq('message', 'socket hang up'),
      // ...print a nicer error message...
      R.always(
        `Could not connect to Lagoon API at ${protocol}//${hostname}:${port}/graphql.`,
      ),
      // ...otherwise just return the error message
      R.prop('message'),
    )(err);
    printErrors(cerr, { message: error });
    process.exit(1);
  }

  return response;
}
