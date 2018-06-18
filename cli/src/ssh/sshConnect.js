// @flow

import R from 'ramda';

import { Client } from 'ssh2';
import { utils } from 'ssh2-streams';
import { config } from '../config';
import { readFile } from '../util/fs';

import { getPrivateKeyPassphrase } from './getPrivateKeyPassphrase';
import { getPrivateKeyPath } from './getPrivateKeyPath';

import type { Connection } from '.';

type SshConnectArgs = {
  identity: ?string,
};

type ConnectConfig = {
  host: string,
  port: number,
  username: string,
  privateKey: string | Buffer,
  passphrase?: string,
};

export async function sshConnect({
  identity,
}:
SshConnectArgs): Promise<Connection> {
  const connection = new Client();

  const privateKeyPath = await getPrivateKeyPath({ identity });
  const privateKey = await readFile(privateKeyPath);
  const passphrase = await getPrivateKeyPassphrase(
    utils.parseKey(privateKey).encryption,
  );

  const username = 'lagoon';

  let host;
  let port;

  if (process.env.SSH_HOST && process.env.SSH_PORT) {
    host = process.env.SSH_HOST;
    port = Number(process.env.SSH_PORT);
  } else if (R.prop('ssh', config)) {
    const sshConfig = R.prop('ssh', config);
    const ssh = R.split(':', sshConfig);
    host = R.head(ssh);
    // .connect() accepts only a number
    port = Number(R.nth(1, ssh));
  } else {
    host = 'ssh.lagoon.amazeeio.cloud';
    port = 32222;
  }

  const connectConfig: ConnectConfig = {
    host,
    port,
    username,
    privateKey,
    passphrase,
  };

  return new Promise((resolve, reject) => {
    connection.on('ready', () => {
      resolve(connection);
    });

    connection.on('error', (err) => {
      if (
        err.message.includes('All configured authentication methods failed')
      ) {
        return reject('SSH key not authorized.');
      }
      reject(err);
    });

    try {
      connection.connect(connectConfig);
    } catch (err) {
      // As of now, `ssh2-streams` has a dependency on `node-asn1`, which is
      // throwing obscure error messages when there are incorrect passphrases
      // for encrypted private keys.
      // Ref: https://github.com/mscdex/ssh2-streams/issues/76
      // Here we catch these errors and throw our own with messages that make
      // more sense.
      if (err.stack.includes('InvalidAsn1Error')) {
        reject('Malformed private key. Bad passphrase?');
      }
      reject(err);
    }
  });
}
