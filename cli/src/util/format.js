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
      () => require('../formatters/table').default(data),
    ],
    [
      R.equals(FORMAT_CHOICE_SIMPLE),
      () => require('../formatters/simple').default(data),
    ],
    [
      R.equals(FORMAT_CHOICE_JSON),
      () => require('../formatters/json').default(data),
    ],
    [
      R.equals(FORMAT_CHOICE_CSV),
      () => require('../formatters/csv').default(data),
    ],
  ])(R.prop(FORMAT, getConfig()));
}
