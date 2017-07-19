// @flow

const Yaml = require('js-yaml');
const path = require('path');
const { readFile, writeFile } = require('../util/fs');

import type { ClientsFile, Client } from '../types';

const clientsFilePath = (repoPath: string) =>
  path.join(repoPath, 'amazeeio', 'clients.yaml');

const clientsToYaml = (client: Client): string =>
  // TODO: Maybe use a schema?
  Yaml.safeDump(client);

const writeClientsFile = (
  repoPath: string,
  yamlContent: string,
): Promise<void> => writeFile(clientsFilePath(repoPath), yamlContent, 'utf8');

const readClientsFile = async (repoPath: string): Promise<ClientsFile> => {
  const yaml = await readFile(clientsFilePath(repoPath), 'utf8');

  // TODO: Maybe use a schema w/ safeLoad?
  return Yaml.safeLoad(yaml);
};

module.exports = {
  clientsFilePath,
  clientsToYaml,
  writeClientsFile,
  readClientsFile,
};
