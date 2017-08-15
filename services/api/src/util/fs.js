// @flow

/**
 * This module exists to promisify all the fs functionality
 */

const fs = require('fs');
const util = require('util');

type ReadFileFn = (filename: string, enc?: string) => Promise<Buffer | string>;
type WriteFileFn = (
  filename: string,
  data: Buffer | string,
  options?: Object | string
) => Promise<void>;

// $FlowIgnore https://github.com/facebook/flow/pull/4176
const readFile: ReadFileFn = util.promisify(fs.readFile);
// $FlowIgnore https://github.com/facebook/flow/pull/4176
const writeFile: WriteFileFn = util.promisify(fs.writeFile);

async function fileExists(path: string): Promise<boolean> {
  try {
    // $FlowIgnore https://github.com/facebook/flow/pull/4176
    const stats = await util.promisify(fs.lstat)(path);

    if (stats.isFile()) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}

module.exports = {
  readFile,
  writeFile,
  fileExists,
};
