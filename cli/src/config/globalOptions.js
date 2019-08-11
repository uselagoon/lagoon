// @flow

import os from 'os';
import path from 'path';
import R from 'ramda';

export const FORMAT: 'format' = 'format';

export const FORMAT_CHOICE_TABLE: 'table' = 'table';
export const FORMAT_CHOICE_SIMPLE: 'simple' = 'simple';
export const FORMAT_CHOICE_JSON: 'json' = 'json';
export const FORMAT_CHOICE_CSV: 'csv' = 'csv';

export const TOKEN: 'token' = 'token';

export const globalOptionDefaults = {
  [FORMAT]: FORMAT_CHOICE_TABLE,
  [TOKEN]: path.join(os.homedir(), '.lagoon-token'),
};

export const globalOptions = {
  [FORMAT]: {
    describe: 'Output format to use',
    type: 'string',
    choices: [
      FORMAT_CHOICE_TABLE,
      FORMAT_CHOICE_SIMPLE,
      FORMAT_CHOICE_JSON,
      FORMAT_CHOICE_CSV,
    ],
    default: R.prop(FORMAT, globalOptionDefaults),
  },
  [TOKEN]: {
    describe: 'The path to the authentication token',
    type: 'string',
  },
};
