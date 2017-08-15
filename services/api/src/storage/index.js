// @flow

const glob = require('glob');
const Yaml = require('js-yaml');
const path = require('path');
const { createSignature } = require('../util/git');

const { readFile, writeFile } = require('../util/fs');

import type { Repository, Signature, Oid } from 'nodegit';

async function readYamlFile(filepath: string): Promise<*> {
  const contents = await readFile(filepath);
  return Yaml.safeLoad(contents.toString());
}

async function writeYamlFile(filepath: string, data: Object): Promise<void> {
  const contents = Yaml.safeDump(data);
  return writeFile(filepath, contents, 'utf-8');
}

function commitFile(
  repository: Repository,
  relFilepath: string,
  signature: Signature = createSignature(),
  message: string
): Promise<Oid> {
  // Create the commit with the passed message.
  return repository.createCommitOnHead(
    [relFilepath],
    signature,
    signature,
    message
  );
}

function repoPath(repository: Repository, ...paths: Array<string>): string {
  return path.join(repository.workdir(), ...paths);
}

function listYamlFiles(listRepoPath: string): Promise<Array<string>> {
  return new Promise((resolve, reject) => {
    glob(`${listRepoPath}/**/*.yaml`, (err, matches) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(matches);
    });
  });
}

module.exports = {
  readYamlFile,
  writeYamlFile,
  commitFile,
  repoPath,
  listYamlFiles,
};
