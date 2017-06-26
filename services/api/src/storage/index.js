// @flow

import glob from 'glob';
import Yaml from 'js-yaml';
import path from 'path';
import { createSignature } from '../util/git';
import * as fs from '../util/fs';

import type { Repository, Signature, Oid } from 'nodegit';

export async function readYamlFile(filepath: string): Promise<*> {
  const contents = await fs.readFile(filepath, 'utf-8');
  return Yaml.safeLoad(contents);
}

export async function writeYamlFile(
  filepath: string,
  data: Object,
): Promise<void> {
  const contents = Yaml.safeDump(data);
  return fs.writeFile(filepath, contents, 'utf-8');
}

export function commitFile(
  repository: Repository,
  relFilepath: string,
  signature: Signature = createSignature(),
  message: string,
): Promise<Oid> {
  // Create the commit with the passed message.
  return repository.createCommitOnHead(
    [relFilepath],
    signature,
    signature,
    message,
  );
}

export const repoPath = (
  repository: Repository,
  ...paths: Array<string>
): string =>
  path.join(repository.workdir(), ...paths);

export function listYamlFiles(listRepoPath: string): Promise<Array<string>> {
  return new Promise((resolve, reject) => {
    glob(`${listRepoPath}/**/*.yaml`, (err, matches) => {
      if (err) {
        reject(err);
        return;
      }
      const ret = matches.map(
        filePath => path.relative(listRepoPath, filePath),
      );
      resolve(ret);
    });
  });
}
