// @flow

import { Client } from 'ssh2';
import { utils } from 'ssh2-streams';
import { getSshConfig } from '../config/getSshConfig';
import { readFile } from '../util/fs';

import { getPrivateKeyPassphrase } from './getPrivateKeyPassphrase';
import { getPrivateKeyPath } from './getPrivateKeyPath';

import type { Connection } from '.';

type SshConnectArgs = {
  identity: ?string,
  cerr: typeof console.error,
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
  cerr,
}:
SshConnectArgs): Promise<Connection> {
  const connection = new Client();

  const privateKeyPath = await getPrivateKeyPath({ identity, cerr });
  const privateKey = await readFile(privateKeyPath);
  const passphrase = await getPrivateKeyPassphrase(
    utils.parseKey(privateKey).encryption,
  );

  const { username, host, port } = getSshConfig();

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
