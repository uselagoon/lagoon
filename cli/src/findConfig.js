// @flow

import path from 'path';
import { fileExists } from './util/fs';
import co from 'co';

/* eslint-disable no-constant-condition */

function* walker(
  dir: string,
  filename: string,
  root: string,
): Generator<*, ?string, *> {
  let next = dir;

  while (true) {
    const full = path.join(next, filename);
    const exists = yield fileExists(full);

    if (exists) {
      return full;
    } else if (next === root) {
      // ${root}/${filename} does not exist, quit
      return null;
    }

    // Otherwise go up one level
    next = path.dirname(next);
  }
}

/**
 * Tries to resolve a given filename, starting at cwd.
 * Will try ${cwd}/$filename, if not found it will step up
 * one directory (..) until it reaches root (/${filename}).
 *
 * If no file was found, it will return null, otherwise the path
 * of the found file.
 */
export default async function findConfig(
  filename: string,
  cwd: string,
): Promise<?string> {
  const start = path.join(cwd, filename);
  const { root } = path.parse(start);

  return co(walker(cwd, filename, root));
}
