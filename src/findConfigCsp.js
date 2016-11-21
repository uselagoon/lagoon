// @flow

/* eslint-disable no-constant-condition */

import path from 'path';
import { chan, go, putAsync, take } from 'js-csp';
import { lstat } from 'fs';

type Channel = any;

function doesFileExist(file: string): Channel {
  const ch = chan();

  lstat(file, (err, stat) => {
    if (err) {
      putAsync(ch, false);
      return;
    }

    putAsync(ch, true);
  });

  return ch;
}

function* walker(dir: string, filename: string, root: string): Generator<*, *, *> {
  let next = dir;

  while (true) {
    const full = path.join(next, filename);
    const exists = yield take(doesFileExist(full));

    if (exists) {
      return full;
    }
    else if (next === root) {
      // ${root}/${filename} does not exist, quit
      return null;
    }

    // Otherwise go up one level
    next = path.dirname(next);
  }
}

export default function findConfig(filename: string, cwd: string): Channel {
  const start = path.join(cwd, filename);
  const { root } = path.parse(start);

  return go(walker, [cwd, filename, root]);
}
