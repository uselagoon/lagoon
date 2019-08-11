// @flow

import chalk from 'chalk';
import R from 'ramda';
import stripAnsi from 'strip-ansi';
import table from 'text-table';
import type { FormatData } from '../types/Format';

// Cast all non-string values to strings in a 2-level nested array
const castNonStringsToStrings = R.map(
  R.map(
    R.ifElse(
      // If the value is a string...
      R.is(String),
      // ...just return the value...
      R.identity,
      // ...otherwise cast it.
      String,
    ),
  ),
);

const colorHeadings = R.over(
  // Modify the heading row...
  R.lensIndex(0),
  // ...to be a middle gray color
  R.map(chalk.hex('#848484')),
);

const showSingleDataRowHeadingsOnLeft = R.ifElse(
  // If the length of the data is exactly 2 (one data row + one heading row)...
  R.compose(
    R.equals(2),
    R.length,
  ),
  // ...display the data with the headings on the left instead of on the top...
  R.transpose,
  // ...otherwise don't transform anything.
  R.identity,
);

export default function formatAsTable(data: FormatData) {
  return table(
    R.compose(
      showSingleDataRowHeadingsOnLeft,
      colorHeadings,
      castNonStringsToStrings,
    )(data),
    {
      // Calculate string length correctly for the columns
      stringLength(str) {
        return stripAnsi(str).length;
      },
    },
  );
}
