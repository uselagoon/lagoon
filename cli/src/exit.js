// @flow

import { red } from 'chalk';
import R from 'ramda';

type Clog = typeof console.log;
type GraphQLError = { message: string };

// FIXME: Improve naming
export function exitError(clog: Clog, ...errors: Array<string | Error | GraphQLError>): number {
  R.compose(R.forEach(clog), R.map(err => (err.stack ? red(err.stack) : red(err))))(errors);
  return 1;
}

export function exitNoConfig(clog: Clog): number {
  return exitError(clog, '.amazeeio.yml config file not found.');
}

export function exitGraphQLError(clog: Clog, errors: Array<GraphQLError>): number {
  const prettyErrors = R.map(error => JSON.stringify(error, null, 2), errors);
  const errorMessage =
    R.length(errors) === 1
      ? 'Oops! The server returned an error:'
      : 'Oops! The server returned errors:';
  return exitError(clog, errorMessage, ...prettyErrors);
}
