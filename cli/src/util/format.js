// @flow

import R from 'ramda';
import {
  FORMAT,
  FORMAT_CHOICE_TABLE,
  FORMAT_CHOICE_SIMPLE,
  FORMAT_CHOICE_JSON,
  FORMAT_CHOICE_CSV,
} from '../config/globalOptions';
import { getConfig } from '../config';

import type { FormatData } from '../types/Format';

export default function format(
  data: FormatData,
  options: ?{
    // Optional transforms for data
    transforms?: { [key: string]: (FormatData) => FormatData },
  },
) {
  const config = getConfig();
  const configuredFormat = R.prop(FORMAT, config);
  const transformByFormat =
    R.path(['transforms', configuredFormat], options) ||
    // Default to just returning the data
    R.identity;
  const transformedData = transformByFormat(data);

  return R.cond([
    [
      R.equals(FORMAT_CHOICE_TABLE),
      R.always(require('../formatters/table').default(transformedData)),
    ],
    [
      R.equals(FORMAT_CHOICE_SIMPLE),
      R.always(require('../formatters/simple').default(transformedData)),
    ],
    [
      R.equals(FORMAT_CHOICE_JSON),
      R.always(require('../formatters/json').default(transformedData)),
    ],
    [
      R.equals(FORMAT_CHOICE_CSV),
      R.always(require('../formatters/csv').default(transformedData)),
    ],
  ])(configuredFormat);
}
