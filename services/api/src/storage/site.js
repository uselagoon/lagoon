// @flow

/* eslint-disable */

const Yaml = require('js-yaml');
// const { readFile } = require('../util/fs');
const { listYamlFiles, readYamlFile } = require('.');

// export const readSiteFiles = (repoPath: string):
export const getAllSites = async (repoPath: string) => {
  const sites = [];

  // const yamlFiles = await listYamlFiles(repoPath);
  // return;
  for (const fileName of await listYamlFiles(repoPath)) {
    // Extract infrastructure and identifier from file name.
    const [ serverInfrastructure, serverIdentifier ] = fileName
      .substr(0, fileName.lastIndexOf('.'))
      .split('/');

    const yaml = await readYamlFile(`${repoPath}${fileName}`, 'utf8');
    if (yaml.hasOwnProperty('drupalsites')) {
      const serverNameOverwriteKey = 'amazeeio::servername';

      const siteHost = yaml.hasOwnProperty(serverNameOverwriteKey)
        ? yaml[serverNameOverwriteKey]
        : `${serverIdentifier}.${serverInfrastructure}`;

      let serverNames;
      let jumpHost;
      // @todo Is it correct to hard-code this?
      const clusterMemberKey = 'drupalhosting::profiles::nginx_backend::cluster_member';

      const jumphostKey = 'amazeeio::jumphost';

      if (serverInfrastructure === 'cluster' && yaml.hasOwnProperty(clusterMemberKey)) {
        serverNames = Object.keys(yaml[clusterMemberKey]).map(key => `${key}.${siteHost}`);
      } else if (serverInfrastructure === 'single') {
        serverNames = [ `backend.${siteHost}` ];
      } else {
        serverNames = siteHost instanceof Array ? siteHost : [ siteHost ];
      }

      if (yaml.hasOwnProperty(jumphostKey)) {
        jumpHost = yaml[jumphostKey];
      } else {
        jumpHost = null;
      }

      Object.keys(yaml.drupalsites).forEach(siteName => {
        if (!yaml.drupalsites.hasOwnProperty(siteName)) {
          return;
        }

        const site = yaml.drupalsites[siteName];
        site.id = `${serverIdentifier}.${serverInfrastructure}/${siteName}`;
        site.siteHost = `${serverIdentifier}.${serverInfrastructure}`;
        site.siteName = siteName;
        site.serverIdentifier = serverIdentifier;
        site.serverInfrastructure = serverInfrastructure;
        site.serverNames = serverNames;
        site.cron = {};
        site.basicAuth = {};
        site.jumpHost = jumpHost;

        sites.push(site);
      });
    }
  }
  return sites;
};
// export
// const path = require('path');
// const R = require('ramda');
// const { readFile, writeFile } = require('../util/fs');
//
// import type { SiteGroupsFile, SiteGroup } from '../types';
//
// export const siteGroupsFilePath = (repoPath: string) =>
//   path.join(repoPath, 'amazeeio', 'sitegroups.yaml');
//
// export const siteGroupToYaml = (siteGroup: SiteGroup): string => // TODO: Maybe use a schema?
// Yaml.safeDump(siteGroup);
//
// export const writeSiteGroupsFile = (repoPath: string, yamlContent: string): Promise<void> =>
//   writeFile(siteGroupsFilePath(repoPath), yamlContent, 'utf8');
//
// export const readSiteGroupsFile = (repoPath: string): Promise<string> =>
//   readFile(siteGroupsFilePath(repoPath), 'utf8');
//
// export const parseSiteGroupsFile = (yamlContent: string): SiteGroupsFile => R.compose(
//   R.propOr({}, 'amazeeio_sitegroups'),
//   // TODO: Maybe use a schema w/ safeLoad?
//   Yaml.safeLoad,
// )(yamlContent);
