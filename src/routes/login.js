// @flow

import jwt from 'jsonwebtoken';
import { get, insert } from '../util/db';
import { validateKey, parseJson, createErrorMiddleware } from '../util/routing';
import type { $Request, $Response } from 'express';

// TODO:
// Currently, this generates the same bearer token every time you
// call this with the same ssh key. Eventually, we might want to
// support multiple bearer tokens when e.g. logging in from different
// devices using the ssh key.
function generateTokenFromKey(key: string): string {
  return jwt.sign(key, 'super-secret-string');
}

function getOrCreateToken(key: string): Promise<string> {
  return get(key).then(doc => doc.token).catch(() => {
    // The token does not exist yet. Generate a new one.
    const token = generateTokenFromKey(key);
    return insert({ key, token }, key).then(() => token);
  });
}

function loginRoute(req: $Request, res: $Response, next: Function) {
  const key = req.body.key;
  const success = token => {
    res.send(token);
  };

  getOrCreateToken(key).then(success).catch(next);
}

export default [parseJson, validateKey, loginRoute];
