import crypto from 'crypto';
import KeycloakConfig from 'keycloak-connect/middleware/auth-utils/config';
import KeycloakGrantManager from '../lib/keycloak-grant-manager';
import { getConfigFromEnv, getLagoonRouteFromEnv } from '../util/config';

export const config = {
  origin: getConfigFromEnv('KEYCLOAK_URL', 'http://keycloak:8080'),
  realm: 'lagoon',
  apiClientSecret: getConfigFromEnv(
    'KEYCLOAK_API_CLIENT_SECRET',
    '<secret not set>'
  ),
  get publicRoute() {
    return getLagoonRouteFromEnv(/keycloak-/, this.origin);
  }
};

const keycloakConfig = new KeycloakConfig({
  authServerUrl: `${config.publicRoute}/auth`,
  realm: config.realm,
  clientId: 'api',
  bearerOnly: true,
  credentials: {
    secret: config.apiClientSecret
  }
});

export const keycloakGrantManager = new KeycloakGrantManager(keycloakConfig);

// Override the library "validateToken" function because it is very strict about
// verifying the ISS, which is the URI of the keycloak server. This fails when
// the URL used in the UI doesn't match what's used in the API.
keycloakGrantManager.validateToken = function validateToken(
  token,
  expectedType
) {
  return new Promise((resolve, reject) => {
    if (!token) {
      reject(new Error('invalid token (missing)'));
    } else if (token.isExpired()) {
      reject(new Error('invalid token (expired)'));
    } else if (!token.signed) {
      reject(new Error('invalid token (not signed)'));
    } else if (token.content.typ !== expectedType) {
      reject(new Error('invalid token (wrong type)'));
    } else if (token.content.iat < this.notBefore) {
      reject(new Error('invalid token (future dated)'));
    } else if (!token.content.iss.includes('auth/realms/lagoon')) {
      reject(new Error('invalid token (wrong ISS)'));
    } else {
      const verify = crypto.createVerify('RSA-SHA256');
      // if public key has been supplied use it to validate token
      if (this.publicKey) {
        try {
          verify.update(token.signed);
          if (!verify.verify(this.publicKey, token.signature, 'base64')) {
            reject(new Error('invalid token (signature)'));
          } else {
            resolve(token);
          }
        } catch (err) {
          reject(
            new Error(
              'Misconfigured parameters while validating token. Check your keycloak.json file!'
            )
          );
        }
      } else {
        // retrieve public KEY and use it to validate token
        this.rotation
          .getJWK(token.header.kid)
          .then(key => {
            verify.update(token.signed);
            if (!verify.verify(key, token.signature)) {
              reject(new Error('invalid token (public key signature)'));
            } else {
              resolve(token);
            }
          })
          .catch(err => {
            reject(
              new Error(
                `failed to load public key to verify token. Reason: ${err.message}`
              )
            );
          });
      }
    }
  });
};
