// @flow

const path = require('path');
const R = require('ramda');
const Yaml = require('js-yaml');
// const { readFile } = require('../util/fs');
const { listYamlFiles, readYamlFile } = require('.');

import type { Site } from '../types';

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

const getSiteFiles = async (siteFilePaths: Array<string>) =>
  R.reduce(
    async (acc, filePath) => ({ ...(await acc), [filePath]: await readYamlFile(filePath) }),
    {},
    siteFilePaths,
  );

const getAllSites = async (siteFilePaths: Array<string>) => {
  const allFiles = await getSiteFiles(siteFilePaths);
  return Object
    .entries(allFiles)
    .reduce(
      (acc, [name, file]) => [
        ...acc,
        ...Object.entries(file.drupalsites).map(([n, site]) => ({ ...site, siteName: n })),
      ],
      [],
    );
};

module.exports = { getServerInfoFromFilename, getSiteFiles, getAllSites };
