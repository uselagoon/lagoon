// @flow

type Clog = typeof console.log;

export function exitNoConfig(clog: Clog): number {
  clog('Could not find .amazeeio.yml config file');
  return 1;
}

export function exitError(clog: Clog, message: string, code?: number = 1): number {
  clog(message);
  return code;
}
