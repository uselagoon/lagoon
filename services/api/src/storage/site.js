// @flow

const path = require('path');
const R = require('ramda');
const Yaml = require('js-yaml');
// const { readFile } = require('../util/fs');
const { listYamlFiles, readYamlFile } = require('.');

import type { Site } from '../types';

async function getSiteYamlFromFile(path: string): Promise<?Site> {
  const yaml = await readYamlFile(path);
  // TODO: Validate this with a schema?
  return R.prop('drupalsites')(yaml);
}

function getServerInfoFromFilename(
  fileName: string,
): ?{ fileName: string, serverInfrastructure: string, serverIdentifier: string } {
  const matches = fileName.match(/([^/]+)\/([^/.]+)\.[^/.]+$/);
  return matches
    ? { fileName, serverInfrastructure: matches[1], serverIdentifier: matches[2] }
    : null;
}

function addSiteHost(site) {
  const siteHost = R.propOr(
    `${site.serverIdentifier}.${site.serverInfrastructure}`,
    'amazeeio::servername',
  )(site.yaml);
  return { ...site, siteHost };
}

function addServerNames(site) {
  let serverNames;
  const CLUSTER_MEMBER_KEY = 'drupalhosting::profiles::nginx_backend::cluster_member';
  if (site.serverInfrastructure === 'cluster' && site.yaml[CLUSTER_MEMBER_KEY]) {
    serverNames = Object
      .keys(site.yaml[CLUSTER_MEMBER_KEY])
      .map(memberKey => `${memberKey}.${site.siteHost}`);
  } else if (site.serverInfrastructure === 'single') {
    serverNames = [`backend.${site.siteHost}`];
  } else {
    serverNames = site.siteHost instanceof Array ? site.siteHost : [site.siteHost];
  }
  return { ...site, serverNames };
}

function maybeAddJumphostKey(site) {
  return { ...site, jumpHost: R.prop('amazeeio::jumphost') };
}

// export const readSiteFiles = (repoPath: string):
const getAllSites = async (repoPath: string) => {
  const sites = [];

  // const yamlFiles = await listYamlFiles(repoPath);
  // console.log(yamlFiles);
  // return;
  const yamlFiles = await listYamlFiles(repoPath);
  // yamlFiles.map()
  // const { serverInfrastructure: string, serverIdentifier: string } = getServerInfoFromFilename(yamlFiles),
  //
  const allSites = R.compose(
    // reduce down to a single array of all sites
    async allYaml => R.reduce(metaObj => R.compose(
      // set extra (meta) values
      R.map(maybeAddJumphostKey),
      R.map(addServerNames),
      R.map(addSiteHost),
      // R.map((site) => {siteName: Object.entries),
      // R.apply(Promise.all),
      // // get yaml from file
      // R.map(async file => ({ ...file, yaml: await getSiteYamlFromFile(file.fileName) })),
      // R.map(getServerInfoFromFilename),
      R.map(site => ({
        ...site,
        id: `${site.serverIdentifier}.${site.serverInfrastructure}/${site.siteName}`,
      })),
    )(metaObj), {})(await allYaml),
    R.apply(Promise.all),
    // get yaml from file
    R.map(async file => ({ ...file, yaml: await getSiteYamlFromFile(file.fileName) })),
    R.map(getServerInfoFromFilename),
  )(yamlFiles);

  yamlFiles.map(() => {
  });

  for (const fileName of await listYamlFiles(repoPath)) {
    // Extract infrastructure and identifier from file name.
    const [serverInfrastructure, serverIdentifier] = fileName
      .substr(0, fileName.lastIndexOf('.'))
      .split('/');

    const yaml = await readYamlFile(`${repoPath}${fileName}`, 'utf8');
    console.log('filename!', fileName);
    //
    if (yaml.hasOwnProperty('drupalsites')) {
      // const serverNameOverwriteKey = 'amazeeio::servername';
      //
      // const siteHost = yaml.hasOwnProperty(serverNameOverwriteKey)
      //   ? yaml[serverNameOverwriteKey]
      //   : `${serverIdentifier}.${serverInfrastructure}`;
      // let serverNames;
      // let jumpHost;
      // @todo Is it correct to hard-code this?
      // const clusterMemberKey = 'drupalhosting::profiles::nginx_backend::cluster_member';
      // const jumphostKey = 'amazeeio::jumphost';
      // if (serverInfrastructure === 'cluster' && yaml.hasOwnProperty(clusterMemberKey)) {
      //   serverNames = Object.keys(yaml[clusterMemberKey]).map(key => `${key}.${siteHost}`);
      // } else if (serverInfrastructure === 'single') {
      //   serverNames = [`backend.${siteHost}`];
      // } else {
      //   serverNames = siteHost instanceof Array ? siteHost : [siteHost];
      // }
      // if (yaml.hasOwnProperty(jumphostKey)) {
      //   jumpHost = yaml[jumphostKey];
      // } else {
      //   jumpHost = null;
      // }
      Object.keys(yaml.drupalsites).forEach((siteName) => {
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

module.exports = { getServerInfoFromFilename, getAllSites };
// export
// const path = require('path');
// const R = require('ramda');
// const { readFile, writeFile } = require('../util/fs');
//
// import type { SiteGroupFile, SiteGroup } from '../types';
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
// export const parseSiteGroupsFile = (yamlContent: string): SiteGroupFile => R.compose(
//   R.propOr({}, 'amazeeio_sitegroups'),
//   // TODO: Maybe use a schema w/ safeLoad?
//   Yaml.safeLoad,
// )(yamlContent);
