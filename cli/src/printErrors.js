// @flow

import { red } from 'chalk';
import R from 'ramda';

type Clog = typeof console.log;
type GraphQLError = { message: string };

const formatError = err =>
  R.cond([
    // If a `stack` property exists on the error object, use that
    [R.prop('stack'), R.prop('stack')],
    // If the error is an object without a `stack` property and isn't null, stringify it
    [
      R.allPass([R.is(Object), !R.equals(null)]),
      errWithoutStack => JSON.stringify(errWithoutStack, null, 2),
    ],
    // Otherwise, just pass it back unmodified
    [R.T, R.identity],
  ])(err);

export function printErrors(
  clog: Clog,
  ...errors: Array<string | Error | GraphQLError>
): number {
  R.compose(R.forEach(clog), R.map(red), R.map(formatError))(errors);
  return 1;
}

export function printNoConfigError(clog: Clog): number {
  return printErrors(clog, '.amazeeio.yml config file not found.');
}

export function printGraphQLErrors(
  clog: Clog,
  ...errors: Array<GraphQLError>
): number {
  const errorMessage =
    R.length(errors) === 1
      ? 'Oops! The amazee.io API returned an error:'
      : 'Oops! The amazee.io API returned errors:';
  return printErrors(clog, errorMessage, ...errors);
}
