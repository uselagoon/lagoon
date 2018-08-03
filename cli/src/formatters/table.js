// @flow

import chalk from 'chalk';
import R from 'ramda';
import stripAnsi from 'strip-ansi';
import table from 'text-table';
import type { FormatData } from '../types/Format';

export default function (data: FormatData) {
  return table(
    // Transform data by...
    R.over(
      // ...modifying the heading row...
      R.lensIndex(0),
      // ...to be a middle gray color
      R.map(chalk.hex('#848484')),
      data,
    ),
    {
      // Calculate string length correctly for the columns
      stringLength(str) {
        return stripAnsi(str).length;
      },
    },
  );
}
