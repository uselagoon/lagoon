import * as R from 'ramda';

// Returns a partial copy of an object containing only the keys specified, as
// long as they are non-nil.
const pickNonNil = (
  names: ReadonlyArray<any>,
  obj: { [propName: string]: any },
): Object =>
  R.pipe(
    R.pick(names),
    R.pickBy(R.complement(R.isNil)),
  )(obj);

export default R.curry(pickNonNil);
