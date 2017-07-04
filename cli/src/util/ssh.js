// @flow

import { Client } from 'ssh2';

type ExecOptions = {};

type Connection = {
  exec: (command: string, options?: ExecOptions, callback: Function) => Connection,
  on: (event: string, callback: Function) => Connection,
  end: () => Connection,
};

type ConnectArgs = {
  host: string,
  port: number,
  username: string,
  privateKey: string | Buffer,
  passphrase?: string,
};

export async function sshConnect(args: ConnectArgs): Promise<Connection> {
  return new Promise((resolve, reject) => {
    const connection = new Client();

    connection.on('ready', () => {
      resolve(connection);
    });

    connection.on('error', (error) => {
      reject(error);
    });

    connection.connect(args);
  });
}

export async function sshExec(
  connection: Connection,
  command: string,
  options?: ExecOptions = {},
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    connection.exec(command, options, (error, stream) => {
      if (error) {
        reject(error);
      } else {
        stream.on('data', (data) => {
          resolve(data);
        });

        stream.stderr.on('data', (data) => {
          reject(new Error(data));
        });
      }
    });
  });
}
