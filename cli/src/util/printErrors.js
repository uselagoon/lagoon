// @flow

import { red } from 'chalk';
import R from 'ramda';

type Cerr = typeof console.error;
type LaguError = { +message: string, +stack?: string };

export function printErrors(cerr: Cerr, ...errors: Array<LaguError>): number {
  R.compose(
    R.forEach(cerr),
    R.map(red),
    R.map(err =>
      R.ifElse(
        R.is(String),
        R.identity,
        R.propOr(
          // ...otherwise, use the message property as a fallback
          R.prop('message', err),
          // Try to get the stack...
          'stack',
        ),
      )(err),
    ),
  )(errors);
  return 1;
}

export function printNoConfigError(cerr: Cerr): number {
  return printErrors(cerr, {
    message:
      '.lagoon.yml config file not found. Please create one with "lagoon init".\nOnline documentation: https://github.com/amazeeio/lagoon/blob/master/cli/README.md#lagoon-init',
  });
}

export function printProjectConfigurationError(cerr: Cerr): number {
  return printErrors(cerr, {
    message:
      'No project configured. Please create a .lagoon.yml config file with "lagoon init" or pass a project to this command via the --project option.\nOnline documentation: https://github.com/amazeeio/lagoon/blob/master/cli/README.md#lagoon-init',
  });
}

export function printGraphQLErrors(
  cerr: Cerr,
  ...errors: Array<LaguError>
): number {
  if (
    R.find(R.propEq('message', 'Unauthorized - Bearer Token Required'))(errors)
  ) {
    return printErrors(cerr, {
      message:
        'No authentication token found. Please log in first with "lagoon login".\nOnline documentation: https://github.com/amazeeio/lagoon/blob/master/cli/README.md#lagoon-login',
    });
  }
  const errorMessage =
    R.length(errors) === 1
      ? 'Oops! The Lagoon API returned an error:'
      : 'Oops! The Lagoon API returned errors:';
  return printErrors(cerr, { message: errorMessage }, ...errors);
}
