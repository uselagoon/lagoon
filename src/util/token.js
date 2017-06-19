// @flow

import jwt from 'jsonwebtoken';

// TODO:
// Currently, this generates the same bearer token every time you
// call this with the same ssh key. Eventually, we might want to
// support multiple bearer tokens when e.g. logging in from different
// devices using the ssh key.
export function generateTokenFromKey(key: string): string {
  return jwt.sign(key, 'super-secret-string');
}
