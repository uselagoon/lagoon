// @flow

/**
 * This module exists to promisify all the fs functionality
 */

import fs from 'fs';

import type { Stats } from 'fs';

export function readFile(filename: string, enc?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, enc || 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export function writeFile(
  filename: string,
  data: Buffer | string,
  options?: Object | string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, options, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function deleteFile(filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.unlink(filename, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function lstat(path: string): Promise<Stats> {
  return new Promise((resolve, reject) => {
    fs.lstat(path, (err, stat) => {
      if (err) {
        reject(err);
      } else {
        resolve(stat);
      }
    });
  });
}

export async function doesFileExist(file: string): Promise<boolean> {
  try {
    const stats = await lstat(file);

    if (stats.isFile()) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}

export const statSync = fs.statSync;
