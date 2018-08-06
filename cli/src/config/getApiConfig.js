// @flow

import url from 'url';
import R from 'ramda';
import { config } from '.';

export const getApiConfig: () => { hostname: string, port: number } = (() => {
  let allApiConfig;

  return () => {
    if (!allApiConfig) {
      // Freeze process.env for Flow
      const env = Object.freeze({ ...process.env });

      // Build API URL from environment variables if protocol, host and port exist
      const envApiUrl: string | null = R.ifElse(
        R.allPass([
          R.prop('API_PROTOCOL'),
          R.prop('API_HOST'),
          R.prop('API_PORT'),
        ]),
        R.always(
          `${R.prop('API_PROTOCOL', env)}://${R.prop('API_HOST', env)}:${R.prop(
            'API_PORT',
            env,
          )}`,
        ),
        R.always(null),
      )(env);

      const apiUrl: string =
        // API URL from environment variables
        envApiUrl ||
        // API URL from config
        R.prop('api', config) ||
        // Default API URL
        'https://api.lagoon.amazeeio.cloud';

      const { protocol, hostname, port } = url.parse(apiUrl);

      if (!hostname) {
        throw new Error(
          'API URL configured under the "api" key in .lagoon.yml doesn\'t contain a valid hostname.',
        );
      }

      const defaultProtocol = 'https:';
      const protocolPorts = {
        'https:': 443,
        'http:': 80,
      };

      allApiConfig = {
        hostname,
        port: R.ifElse(
          // If port is truthy...
          R.identity,
          // ...convert string to number...
          Number,
          // ...else assign the port based on the protocol or the default port
          R.always(R.prop(protocol || defaultProtocol, protocolPorts)),
        )(port),
      };
    }

    return allApiConfig;
  };
})();
