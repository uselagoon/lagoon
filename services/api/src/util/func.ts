// @ts-ignore
import { unless, is, isNil, partialRight, complement } from 'ramda';

export const isNumber = is(Number);
export const isArray = is(Array);

export const toNumber = (input: string | number): number =>
  unless(isNumber, partialRight(parseInt, [10]), input) as number;

export const notArray = complement(isArray);
export const isNotNil = complement(isNil);


// will return only what is in a1 that isn't in a2
// eg:
// a1 = [1,2,3,4]
// a2 = [1,2,3,5]
// arrayDiff(a1,a2) = [4]
export const arrayDiff = (a1, a2) => {
  var a = [], diff = [];
  for (var i = 0; i < a1.length; i++) {
      a[a1[i]] = true;
  }
  for (var i = 0; i < a2.length; i++) {
      if (a[a2[i]]) {
          delete a[a2[i]];
      }
  }
  for (var k in a) {
      diff.push(k);
  }
  return diff;
}