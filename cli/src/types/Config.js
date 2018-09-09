// @flow

import type { ConfigFile } from './ConfigFile';

export type Config = {
  ...ConfigFile,
  // Global config options
  format: string,
  token: string,
};
