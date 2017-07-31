// @flow

const { get, destroy } = require('../util/db');
const { validateKey, parseJson } = require('../util/routing');

import type { $Request, $Response } from 'express';

function destroyToken(key: string): Promise<Object> {
  return get(key).then((doc) => {
    destroy(doc._id, doc._rev);
  });
}

function logoutRoute(req: $Request, res: $Response, next: Function) {
  const key = req.body.key;
  const success = () => {
    res.send('Logged out successfully.');
  };

  destroyToken(key).then(success).catch(next);
}

module.exports = [parseJson, validateKey, logoutRoute];
