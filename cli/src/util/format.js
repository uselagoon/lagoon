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

export default function format(data: FormatData) {
  return R.cond([
    [
      R.equals(FORMAT_CHOICE_TABLE),
      R.always(require('../formatters/table').default(data)),
    ],
    [
      R.equals(FORMAT_CHOICE_SIMPLE),
      R.always(require('../formatters/simple').default(data)),
    ],
    [
      R.equals(FORMAT_CHOICE_JSON),
      R.always(require('../formatters/json').default(data)),
    ],
    [
      R.equals(FORMAT_CHOICE_CSV),
      R.always(require('../formatters/csv').default(data)),
    ],
  ])(R.prop(FORMAT, getConfig()));
}
