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

import init from './init';
import login from './login';
import logout from './logout';
// import sites from './sites';
import customer from './customer';
// import site from './site';
// import sitegroup from './sitegroup';
import project from './project';
import projects from './projects';

// Disable flowtype linting error because prettier formats to this
// eslint-disable-next-line flowtype/generic-spacing
export default ([
  init,
  login,
  logout,
  // sites,
  customer,
  // site,
  // sitegroup,
  project,
  projects,
]: Array<CommandModule>);
