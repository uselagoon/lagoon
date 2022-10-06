import { unless, is, isNil, partialRight, complement } from 'ramda';

export const isNumber = is(Number);
export const isArray = is(Array);

export const toNumber = (input: string | number): number =>
  unless(isNumber, partialRight(parseInt, [10]), input) as number;

export const notArray = complement(isArray);
export const isNotNil = complement(isNil);

export const asyncPipe = (...functions) => input =>
  functions.reduce((chain, func) => chain.then(func), Promise.resolve(input));

export const jsonMerge = function(a, b, prop) {
  var reduced = a.filter(function(aitem) {
    return !b.find(function(bitem) {
      return aitem[prop] === bitem[prop];
    });
  });
  return reduced.concat(b);
}
