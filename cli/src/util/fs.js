// @flow

/**
 * This module exists to promisify all the fs functionality
 */

import fs from 'fs';
// Polyfill for Node 8's util.promisify
import promisify from 'util.promisify';

import type { Stats } from 'fs';

type ReadFileFn = (filename: string, enc?: string) => Promise<string>;
type WriteFileFn = (
  filename: string,
  data: Buffer | string,
  options?: Object | string,
) => Promise<void>;
type UnlinkFn = (filename: string) => Promise<void>;

export const readFile: ReadFileFn = promisify(fs.readFile);
export const writeFile: WriteFileFn = promisify(fs.writeFile);
export const unlink: UnlinkFn = promisify(fs.unlink);

// TODO: @ryyppy Can we use something simpler like promisify(fs.access)?
export async function fileExists(file: string): Promise<boolean> {
  try {
    const stats: Stats = await promisify(fs.lstat)(file);

    if (stats.isFile()) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}

export const statSync = fs.statSync;
