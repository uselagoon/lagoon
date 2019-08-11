// @flow

const R = require('ramda');
const { createJWT } = require('@lagoon/commons/src/jwt');
const { parseJson } = require('./util/routing');

import type { $Request, $Response } from 'express';

type GenerateRouteArgs = {
  jwtSecret: string,
  issuer: string,
  audience?: string,
};

const generateRoute = (args: GenerateRouteArgs) => {
  const { jwtSecret, audience, issuer } = args;

  const route = async (req: $Request, res: $Response) => {
    const userId = R.path(['body', 'userId'], req);
    const role = R.pathOr('none', ['body', 'role'], req);
    const subject = R.path(['body', 'subject'], req);
    const verbose = R.pathOr(false, ['body', 'verbose'], req);

    // Overrides default values
    const aud = R.pathOr(audience, ['body', 'audience'], req);

    if (userId == null) {
      return res.status(500).send('Missing parameter "userId"');
    }

    try {
      const jwtArgs = {
        payload: {
          userId,
          sub: subject,
          iss: issuer,
          role,
          aud,
        },
        jwtSecret,
      };

      const token = await createJWT(jwtArgs);

      // Verbose mode will send back all the information
      // which was being used for creating the token
      if (verbose) {
        res.json({
          payload: jwtArgs.payload,
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
