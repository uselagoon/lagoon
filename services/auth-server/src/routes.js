// @flow

const R = require('ramda');
const { parseJson } = require('./util/routing');
const { createJWT, validateSshKey } = require('./jwt');

type GenerateRouteArgs = {
  jwtSecret: string,
  issuer: string,
  audience?: string,
};

const generateRoute = (args: GenerateRouteArgs) => {
  const { jwtSecret, audience, issuer } = args;

  const route = async (req: $Request, res: $Response, next: Function) => {
    const key = R.path(['body', 'key'], req);
    const role = R.pathOr('none', ['body', 'role'], req);
    const subject = R.path(['body', 'subject'], req);
    const expiresIn = R.path(['body', 'expiresIn'], req);
    const verbose = R.pathOr(false, ['body', 'verbose'], req);

    // Overrides default values
    const aud = R.pathOr(audience, ['body', 'audience'], req);

    if (key == null) {
      return res.status(500).send('missing parameter "key"');
    }

    try {
      const jwtArgs = {
        payload: {
          sshKey: key,
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
