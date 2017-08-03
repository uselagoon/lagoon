// @flow

/**
 * This module exists to promisify all the fs functionality
 */

import fs from 'fs';
// Polyfill for Node 8's util.promisify
import promisify from 'util.promisify';

import type { Stats } from 'fs';

type ReadFileFn = (filename: string, enc?: string) => Promise<Buffer | string>;
type WriteFileFn = (
  filename: string,
  data: Buffer | string,
  options?: Object | string,
) => Promise<void>;
type UnlinkFn = (filename: string) => Promise<void>;

export const readFile: ReadFileFn = promisify(fs.readFile);
export const writeFile: WriteFileFn = promisify(fs.writeFile);
export const unlink: UnlinkFn = promisify(fs.unlink);

export async function fileExists(path: string): Promise<boolean> {
  try {
    const stats: Stats = await promisify(fs.lstat)(path);

    if (stats.isFile()) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}
