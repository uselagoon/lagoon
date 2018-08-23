// @flow

import inquirer from 'inquirer';
import untildify from 'untildify';
import { fileExists } from '../util/fs';
import { printErrors } from '../util/printErrors';

export async function promptUntilValidKeyPath(
  cerr: typeof console.error,
): Promise<string> {
  const { privateKeyPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'privateKeyPath',
      message: 'Path to private key file',
      // TODO: Move the fileExists validation logic to this object under the validate key to fail earlier
    },
  ]);

  if (
    !(await fileExists(
      // Expand tilde characters in paths
      untildify(privateKeyPath),
    ))
  ) {
    printErrors(cerr, { message: 'File does not exist at given path!' });
    return promptUntilValidKeyPath(cerr);
  }
  return privateKeyPath;
}
