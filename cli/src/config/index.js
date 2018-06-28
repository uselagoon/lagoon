// @flow

import fs from 'fs';
import url from 'url';
import R from 'ramda';
import { writeFile } from '../util/fs';
import yaml from 'js-yaml';
import findup from 'findup-sync';

// TODO: Type the rest of the config
export type LagoonConfig = {|
  api?: string,
  branches?: boolean | RegExp,
  customer?: number,
  git_url?: string,
  openshift?: number,
  production_environment?: string,
  project?: string,
  pullrequests?: boolean,
  ssh?: string,
|};

export type LagoonConfigInput = {|
  project: string,
  api?: string,
  ssh?: string,
|};

export function createConfig(
  filepath: string,
  inputOptions: LagoonConfigInput,
): Promise<void> {
  const config: LagoonConfig = {
    ...inputOptions,
  };
  const yamlConfig = yaml.safeDump(config);
  return writeFile(filepath, yamlConfig);
}

export function parseConfig(yamlContent: string): LagoonConfig {
  // TODO: Add schema validation in here if necessary
  return yaml.safeLoad(yamlContent);
}

/**
 * Finds and reads the lagoon.yml file
 */
function readConfig(): LagoonConfig | null {
  const configPath = findup('.lagoon.yml');

  if (configPath == null) {
    return null;
  }

  const yamlContent = fs.readFileSync(configPath);
  return parseConfig(yamlContent.toString());
}

export const config = readConfig();

export const getApiConfig: () => { hostname: string, port: number } = (() => {
  let allApiConfig;

  return () => {
    if (!allApiConfig) {
      const env = Object.freeze({ ...process.env });
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

export const getSshConfig = (() => {
  let allSshConfig;
  return () => {
    if (!allSshConfig) {
      const env = Object.freeze({ ...process.env });

      const [configSshHost: string | null, configSshPort: null] = R.compose(
        (sshConfig) => {
          if (sshConfig && R.contains(':', sshConfig)) {
            const split = R.split(':', sshConfig);
            if (R.length(split) === 2) return split;
          }
          return [null, null];
        },
      )(R.prop('ssh', config));

      const host: string =
        // Host from environment variable
        R.prop('SSH_HOST', env) ||
        // Host from config
        configSshHost ||
        // Default host
        'ssh.lagoon.amazeeio.cloud';

      const port: number =
        // Port from environment variable (needs to be number for .connect())
        Number(R.prop('SSH_HOST', env)) ||
        // Port from config (needs to be number for .connect())
        Number(configSshPort) ||
        // Default port
        32222;

      allSshConfig = {
        username: 'lagoon',
        host,
        port,
      };
    }
    return allSshConfig;
  };
})();
