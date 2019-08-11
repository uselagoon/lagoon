// @flow

/**
 * This module exists to promisify all the fs functionality
 */

import fs from 'fs';
import util from 'util';

import type { Stats } from 'fs';

type ReadFileFn = (filename: string, enc?: string) => Promise<Buffer | string>;
type WriteFileFn = (
  filename: string,
  data: Buffer | string,
  options?: Object | string,
) => Promise<void>;
type UnlinkFn = (filename: string) => Promise<void>;

export const readFile: ReadFileFn = util.promisify(fs.readFile);
export const writeFile: WriteFileFn = util.promisify(fs.writeFile);
export const unlink: UnlinkFn = util.promisify(fs.unlink);

export async function fileExists(path: string): Promise<boolean> {
  try {
    const stats: Stats = await util.promisify(fs.lstat)(path);

    if (stats.isFile()) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}
