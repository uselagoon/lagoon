// @flow

import os from 'os';
import path from 'path';
import { green } from 'chalk';
import { utils } from 'ssh2-streams';
import untildify from 'untildify';
import {
  getPrivateKeyPath,
  getPrivateKeyPassphrase,
  sshConnect,
  sshExec,
} from '../util/ssh';
import { fileExists, readFile, writeFile } from '../util/fs';
import { printErrors } from '../printErrors';

import typeof Yargs from 'yargs';
import type { BaseArgs } from '.';

const name = 'login';
const description = 'Authenticate with amazee.io via an SSH key';

export async function setup(yargs: Yargs): Promise<Object> {
  return yargs.usage(`$0 ${name} - ${description}`).options({
    identity: {
      describe: 'Path to identity (private key)',
      type: 'string',
      alias: 'i',
    },
  }).argv;
}

type Args = BaseArgs & {
  identity: string,
};

export async function run({
  clog,
  cerr,
  identity: identityOption,
}: Args): Promise<number> {
  if (identityOption != null && !await fileExists(identityOption)) {
    return printErrors(cerr, 'File does not exist at identity option path!');
  }

  const homeDir = os.homedir();
  const defaultPrivateKeyPath = path.join(homeDir, '.ssh', 'id_rsa');
  const fileExistsAtDefaultPath = await fileExists(defaultPrivateKeyPath);

  const privateKeyPath = await getPrivateKeyPath({
    fileExistsAtDefaultPath,
    defaultPrivateKeyPath,
    identityOption,
    cerr,
  });

  const privateKey = await readFile(untildify(privateKeyPath));
  const passphrase = await getPrivateKeyPassphrase(
    utils.parseKey(privateKey).encryption,
  );

  let connection;
  try {
    connection = await sshConnect({
      host: process.env.SSH_HOST || 'auth.amazee.io',
      port: Number(process.env.SSH_PORT) || 2020,
      username: process.env.SSH_USER || 'lagoon',
      privateKey,
      passphrase,
    });
  } catch (err) {
    return printErrors(cerr, err);
  }

  const output = await sshExec(connection, 'login');
  const token = output.toString().replace(/(\r\n|\n|\r)/gm, '');
  const tokenFilePath = path.join(homeDir, '.ioauth');
  await writeFile(tokenFilePath, token);

  clog(green('Logged in successfully.'));

  // Be responsible and close the connection after our transaction.
  connection.end();

  return 0;
}

export default {
  setup,
  name,
  description,
  run,
};
