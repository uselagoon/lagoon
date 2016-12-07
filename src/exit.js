// @flow

import { red } from 'chalk';
import { forEach } from 'ramda';

type Clog = typeof console.log;
type GraphQLError = { message: string }

export function exitNoConfig(clog: Clog): number {
  clog('Could not find .amazeeio.yml config file');
  return 1;
}

export function exitError(clog: Clog, message: string, code?: number = 1): number {
  clog(message);
  return code;
}

export function exitGraphQLError(clog: Clog, errors: Array<GraphQLError>, code?: number = 1): number {
  clog(red('Oops! Server sent us some errors:'));
  forEach(({ message }) => clog(`-> ${message}`), errors);
  return code;
}
