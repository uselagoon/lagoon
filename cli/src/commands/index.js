// @flow

import type { AmazeeConfig } from '../util/config';
import typeof Yargs from 'yargs';

export type BaseArgs = {
  _: Array<string>,
  $0: string,
  config: ?AmazeeConfig,
  cwd: string,
  clog: typeof console.log,
  cerr: typeof console.error,
};

export type CommandModule = {
  name: string,
  description: string,
  setup?: (yargs: Yargs) => Promise<Object>,
  run: (argv: Object) => Promise<number>,
};

import login from './login';
import logout from './logout';
import sites from './sites';
import client from './client';
import site from './site';
import sitegroup from './sitegroup';
import init from './init';

// Disable flowtype linting error because prettier formats to this
// eslint-disable-next-line flowtype/generic-spacing
export default ([login, logout, sites, client, init, site, sitegroup]: Array<
  CommandModule,
>);
