// @flow

import type { AmazeeConfig } from '../parseConfig';

export type BaseArgs = {
  _: Array<string>,
  $0: string,
  config: AmazeeConfig,
};

export type CommandModule = {
  name: string,
  description: string,
  setup?: (yargs: Object) => Object,
  run: (argv: Object) => Promise<number>,
};

import list from './list';

export { list };

export default ([list]: Array<CommandModule>);
