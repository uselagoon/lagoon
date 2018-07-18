// @flow

export type BaseArgs = {
  _: Array<string>,
  $0: string,
  cwd: string,
  clog: typeof console.log,
  cerr: typeof console.error,
};
