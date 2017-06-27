// @flow

const Yaml = require('js-yaml');
const path = require('path');
const R = require('ramda');
const { readFile, writeFile } = require('../util/fs');

import type { SiteGroupsFile, SiteGroup } from '../types';

export const siteGroupsFilePath = (repoPath: string) =>
  path.join(repoPath, 'amazeeio', 'sitegroups.yaml');

export const siteGroupToYaml = (siteGroup: SiteGroup): string =>
  // TODO: Maybe use a schema?
  Yaml.safeDump(siteGroup);

export const writeSiteGroupsFile = (
  repoPath: string,
  yamlContent: string,
): Promise<void> =>
  writeFile(siteGroupsFilePath(repoPath), yamlContent, 'utf8');

export const readSiteGroupsFile = (repoPath: string): Promise<string> =>
  readFile(siteGroupsFilePath(repoPath), 'utf8');

export const parseSiteGroupsFile = (yamlContent: string): SiteGroupsFile =>
  R.compose(
    R.propOr({}, 'amazeeio_sitegroups'),
    // TODO: Maybe use a schema w/ safeLoad?
    Yaml.safeLoad,
  )(yamlContent);
