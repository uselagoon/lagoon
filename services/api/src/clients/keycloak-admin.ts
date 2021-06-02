import axios from 'axios';
import * as logger from '../logger';
const KeycloakAdmin = require('keycloak-admin').default;
const { Agent: KeycloakAgent } = require('keycloak-admin/lib/resources/agent');
import { config } from './keycloakClient';

/**
 * Everytime an API request is made, check if the access_token is (or will soon
 * be) expired. If so, get a new token before making the request.
 */
class RetryAgent extends KeycloakAgent {
  constructor(args) {
    super(args);
  }

  request(args) {
    const parentRequest = super.request(args);
    return async payload => {
      const accessToken = this.client.getAccessToken();
      const tokenRaw = Buffer.from(accessToken.split('.')[1], 'base64');
      const token = JSON.parse(tokenRaw.toString());
      const date = new Date();
      const now = Math.floor(date.getTime() / 1000);

      if (token.exp - 10 <= now) {
        logger.debug('keycloakAdminClient: refreshing expired token');
        await this.client.auth();
      }

      return parentRequest(payload);
    };
  }
}

/**
 * Use our custom RetryAgent and save credentials internally for re-auth tasks.
 */
export class RetryKeycloakAdmin extends KeycloakAdmin {
  constructor(connectionConfig, credentials) {
    const agent = new RetryAgent({
      getUrlParams: client => ({
        realm: client.realmName
      }),
      getBaseUrl: client => client.baseUrl,
      axios
    });

    super(connectionConfig, agent);

    this.credentials = credentials;
  }

  async auth() {
    const curRealm = this.realmName;
    this.realmName = this.credentials.realmName;
    await super.auth(this.credentials);
    this.realmName = curRealm;
  }
}

export const getKeycloakAdminClient = async () => {
  const keycloakAdminClient = new RetryKeycloakAdmin(
    {
      baseUrl: `${config.origin}/auth`,
      realmName: config.realm
    },
    {
      realmName: 'master',
      username: config.user,
      password: config.pass,
      grantType: 'password',
      clientId: 'admin-cli'
    }
  );
  await keycloakAdminClient.auth();

  return keycloakAdminClient;
};
