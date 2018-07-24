// @flow

import R from 'ramda';
import { config, configDefaults } from './config';
import { getApiConfig } from './config/getApiConfig';
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
    const tokenFile = R.prop('token', { ...configDefaults, ...config });
    const tokenFileExists = await fileExists(tokenFile);

    if (tokenFileExists) {
      const tokenBuffer = await readFile(tokenFile);
      const token = tokenBuffer.toString().replace(/(\r\n|\n|\r)/gm, '');
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const { hostname, port } = getApiConfig();

  const options = {
    hostname,
    path: '/graphql',
    port,
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

  try {
    return request(options);
  } catch (err) {
    const error = R.ifElse(
      // For socket hang ups...
      R.propEq('message', 'socket hang up'),
      // ...print a nicer error message...
      R.always('Could not connect to Lagoon API.'),
      // ...otherwise just return the error message
      R.prop('message'),
    )(err);
    printErrors(cerr, { message: error });
    process.exit(1);
  }
}

export default runGQLQuery;
