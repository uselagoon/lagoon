// @flow

import { view } from '../util/db';

function getKeyFromToken(token: string): Promise<string> {
  return view('auth', 'by_token', { token }).then((body) => {
    if (!body.rows.length) {
      return Promise.reject(new Error("Couldn't find key for token."));
    }
    return body.rows[0].key;
  });
}

function authenticateRoute(req: $Request, res: $Response, next: Function) {
  const token = (req.params && req.params.token) || '';
  const success = (key) => {
    res.send(key);
  };

  getKeyFromToken(token).then(success).catch(next);
}

export default [authenticateRoute];
