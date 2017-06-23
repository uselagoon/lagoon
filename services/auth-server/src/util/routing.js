// @flow

import sshpk from 'sshpk';
import bodyParser from 'body-parser';
import type { $Request, $Response } from 'express';

export function validateKey(
  req: $Request,
  res: $Response,
  next: Function
): void {
  const key = (req.body && req.body.key) || '';

  if (!key) {
    return next(new Error('Missing key parameter in request body.'));
  }

  try {
    // Validate the format of the ssh key. This fails with an exception
    // if the key is invalid. We are not actually interested in the
    // result of the parsing and just use this for validation.
    sshpk.parseKey(key, 'ssh');

    next();
  } catch (e) {
    next(new Error('Invalid key parameter in request body.'));
  }
}

export const parseJson = bodyParser.json();
