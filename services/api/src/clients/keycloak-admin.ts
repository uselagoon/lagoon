import { decode } from 'jsonwebtoken';
import { KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';
import { logger } from '../loggers/logger';
import { config } from './keycloakClient';
import { getConfigFromEnv } from '../util/config';

/// Helper to type check try/catch. Remove when we can stop using the @s3pweb
// commonJS version.
export const isNetworkError = (
  error: unknown,
): error is {
  response: {
    status: number;
  };
} => {
  return (
    typeof error === 'object' &&
    'response' in error &&
    typeof error.response === 'object'
  );
};

export const getKeycloakAdminClient = async (): Promise<KeycloakAdminClient> => {
  const keycloakAdminClient = new KeycloakAdminClient({
    baseUrl: `${config.origin}/auth`,
    realmName: config.realm,
  });

  /**
   * Use a custom token provider that can automatically refresh expired tokens.
   */
  keycloakAdminClient.registerTokenProvider({
    async getAccessToken() {

      if (keycloakAdminClient.accessToken) {
        const token = decode(keycloakAdminClient.accessToken);
        const now = Math.floor(Date.now() / 1000);

        if (token.exp - 30 > now) {
          return keycloakAdminClient.accessToken;
        }

        logger.debug('keycloakAdminClient: refreshing expired token');
      }

      // Always auth against master realm.
      const curRealm = keycloakAdminClient.realmName;
      keycloakAdminClient.setConfig({
        realmName: 'master',
      });

      await keycloakAdminClient.auth({
        grantType: 'client_credentials',
        clientId: 'admin-api',
        clientSecret: getConfigFromEnv(
          'KEYCLOAK_ADMIN_API_CLIENT_SECRET',
          '<secret not set>'
        ),
      });

      keycloakAdminClient.setConfig({
        realmName: curRealm,
      });

      return keycloakAdminClient.accessToken;
    },
  });

  return keycloakAdminClient;
};
