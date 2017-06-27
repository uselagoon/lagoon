// @flow

import glob from 'glob';
import Yaml from 'js-yaml';
import path from 'path';
import { createSignature } from './util/git';
import * as fs from './util/fs';

import type { Repository } from 'nodegit';

export type Storage = {
  existsFile(filename: string): Promise<boolean>,
  accessFile(filename: string): Promise<boolean>,
  readFile<R>(filename: string): Promise<R>,
  writeFile(filename: string, data: Object): Promise<void>,
  commitFile(filename: string, message: string): Promise<void>,
  listYamlFiles(): Promise<Array<string>>,
};

export default function createStorage(repository: Repository): Storage {
  const repoPath = repository.workdir();
  const getFilePath = filename => path.join(repoPath, filename);

  return {
    existsFile: async (filename) => {
      const filePath = getFilePath(filename);
      return fs.doesFileExist(filePath);
    },
    accessFile: async (filename) => {
      const filePath = getFilePath(filename);

      try {
        // Invert the return value (in the callback version, there is an 'error'
        // argument in case access is denied).
        return !await fs.accessFile(filePath);
      } catch (error) {
        return false;
      }
    },
    readFile: async (filename) => {
      const filePath = getFilePath(filename);
      const contents = await fs.readFile(filePath, 'utf-8');
      return Yaml.safeLoad(contents);
    },
    writeFile: async (filename, data) => {
      const filePath = getFilePath(filename);

      const contents = Yaml.safeDump(data);
      return fs.writeFile(filePath, contents, 'utf-8');
    },
    commitFile: async (filename, message) => {
      const signature = createSignature();

      // Create the commit with the passed message.
      await repository.createCommitOnHead(
        [filename],
        signature,
        signature,
        message,
      );
    },
    listYamlFiles: (): Promise<Array<string>> =>
      glob
        .sync(`${repoPath}/**/*.yaml`)
        .map(filePath => path.relative(repoPath, filePath)),
  };
}
