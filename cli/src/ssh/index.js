// @flow

export type Connection = {
  exec: (command: string, options?: Object, callback: Function) => Connection,
  on: (event: string, callback: Function) => Connection,
  end: () => Connection,
};
