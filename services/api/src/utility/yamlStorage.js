import Promise from 'bluebird';
import glob from 'glob';
import Yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import createSignature from './createSignature';

// Convert the unconvenient callback versions to yield promises.
const readFilePromise = Promise.promisify(fs.readFile);
const writeFilePromise = Promise.promisify(fs.writeFile);
const accessFilePromise = Promise.promisify(fs.access);
const statFilePromise = Promise.promisify(fs.stat);

export const existsFile = async (fileName) => {
  const filePath = path.join('.', '.repository', fileName);

  try {
    return !!(await statFilePromise(filePath));
  } catch (error) {
    return false;
  }
};

export const accessFile = async (fileName) => {
  const filePath = path.join('.', '.repository', fileName);

  try {
    // Invert the return value (in the callback version, there is an 'error'
    // argument in case access is denied).
    return !(await accessFilePromise(filePath));
  } catch (error) {
    return false;
  }
};

export const readFile = async (fileName) => {
  const filePath = path.join('.', '.repository', fileName);
  const contents = await readFilePromise(filePath, 'utf-8');
  return Yaml.safeLoad(contents);
};

export const writeFile = async (fileName, data) => {
  const filePath = path.join('.', '.repository', fileName);
  const contents = Yaml.safeDump(data);
  return writeFilePromise(filePath, contents, 'utf-8');
};

export const commitFile = async (fileName, message, repository) => {
  const signature = createSignature();

  // Create the commit with the passed message.
  await repository.createCommitOnHead([fileName], signature, signature, message);
};

export const listYamlFiles = async () => {
  const repositoryPath = path.join('.', '.repository');

  return await glob
    .sync(`${repositoryPath}/**/*.yaml`)
    .map((filePath) => path.relative(repositoryPath, filePath));
};
