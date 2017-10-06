// @flow

const R = require('ramda');
const jwt = require('jsonwebtoken');
const sshpk = require('sshpk');

export type Role = 'none' | 'admin' | 'drush';

export type Payload = {|
  // This needs to be a valid ssh key (starting w/ 'ssh-rsa ...')
  sshKey: string,
  role: Role,

  // Issuer - Information on who created this token
  iss: string,

  // Subject - Unique identifier for the user / identity
  sub?: string,

  // Audience - Url of the resource server the token was intended for (e.g. http://api.amazee.io)
  aud?: string,

  // IssuedAt timestamp (needs to be > 0)
  iat?: number,

  // Expiration as NumericDate
  // Example for an expiration timestamp in 1 hour: Math.floor(Date.now() / 1000) + (60 * 60)
  exp?: number,
|};

// Most of these parameters are described in more detail in the jsonwebtoken README
// See: https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback
type Args = {
  payload: Payload,
  expiresIn?: string, //expressed in seconds or a string describing a time span zeit/ms. Eg: 60, "2 days", "10h", "7d"
  jwtSecret: string, // The passphrase to sign the token with
};

// This will create a token from given meta data and sshKey.
// Note: This function requires a common public ssh key format
//       starting with the key-type (e.g. ssh-rsa)... the payload
//       of the token will only contain the base64 part though.
//       This is because of the way we store keys in hiera
const createJWT = async (args: Args): Promise<string> => {
  return new Promise((res, rej) => {
    const { sshKey } = args.payload;

    if (!validateSshKey(sshKey)) {
      rej(
        new Error(
          'Invalid ssh-key public key format (should start with e.g. ssh-rsa)'
        )
      );
      return;
    }

    const { jwtSecret, expiresIn } = args;
    const parsedSshKey = extractBase64Key(sshKey);

    // We use a different "format" of the sshKey... we just use the base64 part
    const payload = R.assoc('sshKey', parsedSshKey, args.payload);

    // Sometimes we want some expiresIn values, if we don't know an exact payload.exp
    const options = expiresIn ? { expiresIn } : null;

    // By passing an object, sign will add an issuer timestamp (iat)
    // that means, the token hash will always be different on each creation
    jwt.sign(payload, jwtSecret, options, (err, token) => {
      if (err) {
        rej(err);
        return;
      }
      res(token);
    });
  });
};

// TODO: In hiera, we don't store comment / type information in the key
//       itself, that means we need to extract the base64 string of the
//       given ssh key and use that for the token payload... otherwise
//       string comparison won't work in the authorization part (api)

//    0       1        2
// ssh-rsa base-64 [comment]
// Gets plain key information without comment / type information
const extractBase64Key /*: string => ?string */ = R.compose(
  R.prop(1),
  R.split(' '),
  R.defaultTo('')
);

const validateSshKey = (key: string): boolean => {
  // Validate the format of the ssh key. This fails with an exception
  // if the key is invalid. We are not actually interested in the
  // result of the parsing and just use this for validation.
  try {
    sshpk.parseKey(key, 'ssh');
    return true;
  } catch (e) {
    return false;
  }
};

// const createValidatedJWT = R.compose();

module.exports = {
  extractBase64Key,
  createJWT,
  validateSshKey,
};
