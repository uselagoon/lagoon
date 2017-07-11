// @flow

import { red } from 'chalk';
import R from 'ramda';

type Clog = typeof console.log;
type GraphQLError = { message: string };

export function exitNoConfig(clog: Clog): number {
  clog('Could not find .amazeeio.yml config file');
  return 1;
}

export function exitError(clog: Clog, ...errors: Array<string>): number {
  R.compose(
    R.apply(clog),
    R.tail,
    R.flatten,
    R.map(err => ['\n', err]),
    R.map(err => (err.stack ? red(err.stack) : red(err))),
  )(errors);
  return 1;
}

export function exitGraphQLError(
  clog: Clog,
  errors: Array<GraphQLError>,
  code?: number = 1,
): number {
  clog(red('Oops! The server returned errors:'));
  R.forEach(err => clog('\n', err), errors);
  return code;
}
