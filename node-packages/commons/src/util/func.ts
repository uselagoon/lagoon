// @ts-ignore
import { unless, is, isNil, isEmpty, partialRight, complement } from 'ramda';

export const isNumber = is(Number);
export const isArray = is(Array);

export const toNumber = (input: string | number): number =>
  unless(isNumber, partialRight(parseInt, [10]), input) as number;

export const notArray = complement(isArray);
export const isNotNil = complement(isNil);
export const isNotEmpty = complement(isEmpty);

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

// will return only what is in a1 that isn't in a2
// eg:
// a1 = [1,2,3,4]
// a2 = [1,2,3,5]
// arrayDiff(a1,a2) = [4]
export const arrayDiff = (a:Array<any>, b:Array<any>) =>  a.filter(e => !b.includes(e));
