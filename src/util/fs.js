// @flow

/**
 * This module exists to promisify all the fs functionality
 */

import fs from 'fs';

export async function readFile(filename: string, encOrOpts?: string | Object): Promise<string | Buffer> {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, encOrOpts || {}, (err, data) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(data);
      }
    });
  });
}

export async function lstat(path: string) {
  return new Promise((resolve, reject) => {
    fs.lstat(path, (err, stat) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(stat);
      }
    });
  });
}

export const statSync = fs.statSync;
