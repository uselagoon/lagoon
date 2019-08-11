// @flow

import R from 'ramda';
import type { FormatData } from '../types/Format';

export default function formatAsSimple(data: FormatData) {
  const columnHeadings = R.head(data);
  return R.compose(
    R.join('\n\n'),
    R.map(
      R.compose(
        R.join('\n'),
        (R.addIndex(R.map): Function)(
          (val, key) => `${R.nth(key, columnHeadings)}: ${val}`,
        ),
      ),
    ),
    R.slice(1, Infinity),
  )(data);
}
