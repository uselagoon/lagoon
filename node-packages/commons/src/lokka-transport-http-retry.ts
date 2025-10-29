import fetchUrl from 'node-fetch';
import { createJWTWithoutUserId } from './jwt';
import { logger } from './logs/local-logger';
import { envHasConfig, getConfigFromEnv } from './util/config';

// Base transport interface to maintain compatibility
interface TransportOptions {
  headers?: Record<string, string>;
  timeout?: number;
  [key: string]: any;
}

class NetworkError extends Error {}
class ApiError extends Error {}

// generate a fresh token for each operation
const generateToken = (): string => {
  if (!envHasConfig('JWTSECRET') || !envHasConfig('JWTAUDIENCE')) {
    logger.error(
      'Unable to create api token due to missing `JWTSECRET`/`JWTAUDIENCE` environment variables'
    );
    return '';
  }

  const apiAdminToken = createJWTWithoutUserId(
    {
      role: 'admin',
      iss: 'lagoon-internal',
      aud: getConfigFromEnv('JWTAUDIENCE'),
      // set a 60s expiry on the token
      exp: Math.floor(Date.now() / 1000) + 60
    },
    getConfigFromEnv('JWTSECRET')
  );

  return `Bearer ${apiAdminToken}`;
};

// Retries the fetch if operational/network errors occur
const retryFetch = (endpoint: string, options: any, retriesLeft = 5, interval = 1000): Promise<any> =>
  new Promise((resolve, reject) => {
    // get a fresh token for every request
    options.headers.Authorization = generateToken();

    return fetchUrl(endpoint, options)
      .then(response => {
        if (response.status !== 200 && response.status !== 400) {
          throw new NetworkError(`Invalid status code: ${response.status}`);
        }
        return response.json();
      })
      .then(({ data, errors }) => {
        if (errors) {
          const error = new ApiError(`GraphQL Error: ${errors[0].message}`) as any;
          error.rawError = errors;
          error.rawData = data;
          throw error;
        }
        resolve(data);
      })
      .catch(error => {
        // Don't retry if limit is reached or the error was not network/operational
        if (retriesLeft === 1 || error instanceof ApiError) {
          reject(error);
          return;
        }

        setTimeout(() => {
          retryFetch(endpoint, options, retriesLeft - 1, interval).then(resolve, reject);
        }, interval);
      });
  });

export class Transport {
  private endpoint: string;
  private options: TransportOptions;

  constructor(endpoint: string, options: TransportOptions = {}) {
    this.endpoint = endpoint;
    this.options = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 30000,
      ...options
    };
  }

  private _buildOptions(payload: any) {
    return {
      method: 'POST',
      ...this.options,
      body: JSON.stringify(payload)
    };
  }

  send(query: string, variables?: any, operationName?: string): Promise<any> {
    const payload = { query, variables, operationName };
    const options = this._buildOptions(payload);
    return retryFetch(this.endpoint, options);
  }
}
