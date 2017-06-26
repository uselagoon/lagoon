// @flow

import path from 'path';
import { readFile } from '../util/fs';
import { debug } from '../logger';

import type { $Request, $Response } from 'express';

export const keysAccessMiddleware = (
  req: $Request,
  res: $Response,
  next: Function,
) => {
  // TODO:
  // This should restrict access for all requests except those
  // from the local network (from the ssh agent service).
  next();
};

export default async (req: $Request, res: $Response) => {
  debug('Collecting client keys.');

  // TODO:
  // This should actually fetch ssh keys from the store.
  const keys = await readFile(path.resolve(__dirname, 'keys.txt'), 'utf8');
  res.send(keys);
};
