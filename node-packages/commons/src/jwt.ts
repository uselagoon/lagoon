import { is } from 'ramda';
import { sign } from 'jsonwebtoken';

type Role = 'none' | 'admin' | 'drush';
interface Permissions {
  projects: number[];
  customers: number[];
}

interface Payload {
  role: Role;

  // Issuer - Information on who created this token
  iss: string;

  // Subject - Unique identifier for the user / identity
  sub?: string;

  // Audience - Url of the resource server the token was intended for (e.g. http://api.amazee.io)
  aud?: string;

  // IssuedAt timestamp (needs to be > 0)
  iat?: number;

  // Expiration as NumericDate
  // Example for an expiration timestamp in 1 hour: Math.floor(Date.now() / 1000) + (60 * 60)
  exp?: number;
}

interface PayloadWithUser extends Payload {
  userId: number;
  permissions: Permissions;
}

// Most of these parameters are described in more detail in the jsonwebtoken README
// See: https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback
interface CreateJWTCommonArgs {
  expiresIn?: string; //expressed in seconds or a string describing a time span zeit/ms. Eg: 60, "2 days", "10h", "7d"
  jwtSecret: string; // The passphrase to sign the token with
}

interface CreateJWTArgs extends CreateJWTCommonArgs {
  payload: PayloadWithUser;
}

interface CreateJWTWithoutUserIdArgs extends CreateJWTCommonArgs {
  payload: Payload;
}

// Create a token from given metadata and userId
export const createJWT = async ({
  payload,
  payload: { userId },
  jwtSecret,
  expiresIn
}: CreateJWTArgs): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!is(Number, userId)) {
      reject(
        new Error(
          `Incorrect userId parameter "${userId}" passed (expecting a number)!`
        )
      );
    }

    // Sometimes we want some expiresIn values, if we don't know an exact payload.exp
    const options = expiresIn ? { expiresIn } : null;

    // By passing an object, sign will add an issued at timestamp (iat).
    // Because of this, the token hash will be different for every call of this function.
    sign(payload, jwtSecret, options, (err, token) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(token);
    });
  });

// Create a JWT without any user ID checks.
//
// This function is also synchronous, which is useful for creating service
// tokens, which generally get created during startup of services. Beware
// the performance implications of using this in async environments!
export const createJWTWithoutUserId = ({
  expiresIn,
  jwtSecret,
  payload
}: CreateJWTWithoutUserIdArgs): string => {
  // Sometimes we want some expiresIn values, if we don't know an exact payload.exp
  const options = expiresIn ? { expiresIn } : null;

  // By passing an object, sign will add an issued at timestamp (iat).
  // Because of this, the token hash will be different for every call of this function.
  return sign(payload, jwtSecret, options);
};
