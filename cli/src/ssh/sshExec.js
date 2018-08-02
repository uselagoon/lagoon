// @flow

import type { Connection } from '.';

export async function sshExec(
  connection: Connection,
  command: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    connection.exec(command, {}, (error, stream) => {
      const chunks = [];

      if (error) {
        reject(error);
      } else {
        stream.on('data', (chunk) => {
          chunks.push(chunk);
        });

        stream.on('close', (code) => {
          const response = Buffer.concat(chunks);

          if (code === 1) {
            reject(new Error(response));
          }

          resolve(response);
        });
      }
    });
  });
}
