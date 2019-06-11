// @flow

const R = require('ramda');
const { parseJson } = require('./util/routing');

import type { $Request, $Response } from 'express';

const generateRoute = (getUserToken: (userId: string) => Promise<string>) => {
  const route = async (req: $Request, res: $Response) => {
    const userId = R.path(['body', 'userId'], req);
    const verbose = R.pathOr(false, ['body', 'verbose'], req);

    if (userId == null) {
      return res.status(500).send('Missing parameter "userId"');
    }

    try {
      const token = await getUserToken(userId);

      // Verbose mode will send back all the information
      // which was being used for creating the token
      if (verbose) {
        res.json({
          payload: {
            userId,
          },
          token,
        });
      } else {
        res.send(token);
      }
    } catch (e) {
      res.status(500).send(e.message);
    }
  };

  return [parseJson, route];
};

module.exports = {
  generateRoute,
};
