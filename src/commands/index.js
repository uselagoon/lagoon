// @flow

import type { AmazeeConfig } from '../parseConfig';
import typeof { default as Yargs } from 'yargs';

export type BaseArgs = {
  _: Array<string>,
  $0: string,
  config: ?AmazeeConfig,
  cwd: string,
  clog?: typeof console.log,
};

export type CommandModule = {
  name: string,
  description: string,
  setup?: (yargs: Yargs) => Promise<Object>,
  run: (argv: Object) => Promise<number>,
};

import list from './list';
import init from './init';

export { list, init };

export default ([list, init]: Array<CommandModule>);
