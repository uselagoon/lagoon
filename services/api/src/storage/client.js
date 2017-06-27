// @flow

const Yaml = require('js-yaml');
const path = require('path');
const R = require('ramda');
const { readFile, writeFile } = require('../util/fs');

import type { ClientFile, Client } from '../types';

export const clientsFilePath = (repoPath: string) =>
  path.join(repoPath, 'amazeeio', 'clients.yaml');

export const clientToYaml = (client: Client): string =>
  // TODO: Maybe use a schema?
  Yaml.safeDump(client);

export const writeClientsFile = (
  repoPath: string,
  yamlContent: string,
): Promise<void> => writeFile(clientsFilePath(repoPath), yamlContent, 'utf8');

export const readClientsFile = (repoPath: string): Promise<string> =>
  readFile(clientsFilePath(repoPath), 'utf8');

export const parseClientsFile = (yamlContent: string): ClientFile =>
  R.compose(
    R.propOr({}, 'amazeeio_clients'),
    // TODO: Maybe use a schema w/ safeLoad?
    Yaml.safeLoad,
  )(yamlContent);
