// @flow

const Yaml = require('js-yaml');
const path = require('path');
const R = require('ramda');
const { readFile, writeFile } = require('../util/fs');

import type { SiteGroupsFile, SiteGroup } from '../types';

const siteGroupsFilePath = (repoPath: string) =>
  path.join(repoPath, 'amazeeio', 'sitegroups.yaml');

const siteGroupToYaml = (siteGroup: SiteGroup): string =>
  // TODO: Maybe use a schema?
  Yaml.safeDump(siteGroup);

const writeSiteGroupsFile = (
  repoPath: string,
  yamlContent: string,
): Promise<void> =>
  writeFile(siteGroupsFilePath(repoPath), yamlContent, 'utf8');

const readSiteGroupsFile = async (
  repoPath: string,
): Promise<SiteGroupsFile> => {
  // TODO: Maybe use a schema w/ safeLoad?
  const yaml = await readFile(siteGroupsFilePath(repoPath), 'utf8');
  return Yaml.safeLoad(yaml);
};

module.exports = {
  siteGroupsFilePath,
  siteGroupToYaml,
  writeSiteGroupsFile,
  readSiteGroupsFile,
};
