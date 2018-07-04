// @flow

import R from 'ramda';
import { config } from '.';

export const getSshConfig = (() => {
  let allSshConfig;

  return () => {
    if (!allSshConfig) {
      // Freeze process.env for Flow
      const env = Object.freeze({ ...process.env });

      // Parse the host and the port from the config string under `ssh`
      const [
        configSshHost: string | null,
        configSshPort: string | null,
      ] = R.compose((sshConfig) => {
        if (sshConfig && R.contains(':', sshConfig)) {
          const split = R.split(':', sshConfig);
          if (R.length(split) === 2) return split;
        }
        return [null, null];
      })(R.prop('ssh', config));

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
