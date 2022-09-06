import * as R from 'ramda';

export const queryStringToObject = R.pipe(
  R.defaultTo(''),
  R.replace(/^\?/, ''),
  R.split('&'),
  R.map(R.split('=')),
  R.fromPairs
);

export const makeSafe = string => string.toLocaleLowerCase().replace(/[^0-9a-z-]/g,'-')