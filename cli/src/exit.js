// @flow

import { red } from 'chalk';
import R from 'ramda';

type Clog = typeof console.log;
type GraphQLError = { message: string };

// FIXME: Improve naming
export function exitError(clog: Clog, ...errors: Array<string | Error | GraphQLError>): number {
  R.compose(
    R.apply(clog),
    R.tail,
    R.chain(err => ['\n', err]),
    R.map(err => (err.stack ? red(err.stack) : red(err))),
  )(errors);
  return 1;
}

export function exitNoConfig(clog: Clog): number {
  return exitError(clog, '.amazeeio.yml config file not found.');
}

export function exitGraphQLError(clog: Clog, errors: Array<GraphQLError>): number {
  return exitError(clog, 'Oops! The server returned errors:', ...errors);
}
