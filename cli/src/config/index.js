// @flow

import fs from 'fs';
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
function readConfig(): ?LagoonConfig {
  const configPath = findup('.lagoon.yml');

  if (configPath == null) {
    return null;
  }

  const yamlContent = fs.readFileSync(configPath);
  return parseConfig(yamlContent.toString());
}

export const config = readConfig();

export const getSshConfig = (() => {
  let allSshConfig;
  return () => {
    if (!allSshConfig) {
      const username = 'lagoon';
      const sshConfig = R.prop('ssh', config);

      const host = R.cond([
        [R.prop('SSH_HOST'), R.prop('SSH_HOST')],
        [R.always(sshConfig), () => R.head(R.split(':', sshConfig))],
        [
          // Default host
          R.T,
          R.always('ssh.lagoon.amazeeio.cloud'),
        ],
      ])(process.env);

      const port = R.cond([
        [
          R.prop('SSH_PORT'),
          R.compose(
            // .connect() accepts only a number
            Number,
            R.prop('SSH_PORT'),
          ),
        ],
        [
          R.always(sshConfig),
          () =>
            R.compose(
              // .connect() accepts only a number
              Number,
              R.nth(1),
              R.split(':'),
            )(sshConfig),
        ],
        [
          // Default port
          R.T,
          R.always(32222),
        ],
      ])(process.env);

      allSshConfig = {
        username,
        host,
        port,
      };
    }
    return allSshConfig;
  };
})();
