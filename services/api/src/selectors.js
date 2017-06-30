// @flow

const R = require('ramda');

function getServerInfoFromFilename(
  fileName: string,
): ?{ fileName: string, serverInfrastructure: string, serverIdentifier: string } {
  const matches = fileName.match(/([^/]+)\/([^/.]+)\.[^/.]+$/);
  return matches
    ? { fileName, serverInfrastructure: matches[1], serverIdentifier: matches[2] }
    : null;
}
//
// function addSiteHost(site) {
//   const siteHost = R.propOr(
//     `${site.serverIdentifier}.${site.serverInfrastructure}`,
//     'amazeeio::servername',
//   )(site.yaml);
//   return { ...site, siteHost };
// }
//
// function addServerNames(site) {
//   let serverNames;
//   const CLUSTER_MEMBER_KEY = 'drupalhosting::profiles::nginx_backend::cluster_member';
//   if (site.serverInfrastructure === 'cluster' && site.yaml[CLUSTER_MEMBER_KEY]) {
//     serverNames = Object
//       .keys(site.yaml[CLUSTER_MEMBER_KEY])
//       .map(memberKey => `${memberKey}.${site.siteHost}`);
//   } else if (site.serverInfrastructure === 'single') {
//     serverNames = [`backend.${site.siteHost}`];
//   } else {
//     serverNames = site.siteHost instanceof Array ? site.siteHost : [site.siteHost];
//   }
//   return { ...site, serverNames };
// }
//
// function maybeAddJumphostKey(site) {
//   return { ...site, jumpHost: R.prop('amazeeio::jumphost') };
// }

const extractSshKeyDefinitions = R.compose(
  R.ifElse(R.isEmpty, R.always([]), R.identity),
  R.map(([owner, value]) => ({ ...value, owner })),
  Object.entries,
  R.propOr({}, 'ssh_keys'),
);

const extractSshKeys = R.compose(
  R.ifElse(R.isEmpty, R.always([]), R.identity),
  R.map(value => `${value.type || 'ssh-rsa'} ${value.key}`),
  R.filter(value => !!value.key),
  extractSshKeyDefinitions,
);

const getSshKeysFromClients = R.compose(
  R.flatten,
  R.map(extractSshKeys),
);

const getAllSiteGroups = R.compose(
  R.map(([id, siteGroup]) => ({ ...siteGroup, id, site_group_name: id })),
  Object.entries,
  R.propOr({}, 'siteGroups'),
);

const getAllSitesByEnv = ({ siteFiles }, env) =>
  R.compose(
    R.map(([siteName, site]) => ({ ...site, siteName })),
    R.filter(([, site]) => site.site_environment === env),
    R.reduce((acc, curr) => [...acc, ...curr], []),
    R.map(file => R.toPairs(file.drupalsites)),
    R.values,
  )(siteFiles);

const getSiteByName = ({ siteFiles }, name) =>
  Object
    .values(siteFiles)
    .map(
    file =>
      Object
        .entries(file.drupalsites)
        .find(([siteName, site]) => siteName === name ? site : null)[1],
  )[0];

const getAllClients = R.compose(
  R.map(([id, client]) => ({ ...client, id, client_name: id })),
  Object.entries,
  R.propOr({}, 'clients'),
);

const getClientByName = (state, name) =>
  R.compose(R.find(client => client.client_name === name), getAllClients)(state);

const getSiteGroupsByClient = (state, client) =>
  R.compose(R.filter(siteGroup => siteGroup.client === client.client_name), getAllSiteGroups)(
    state,
  );

module.exports = {
  getAllSiteGroups,
  getSiteByName,
  getAllSitesByEnv,
  getAllClients,
  getClientByName,
  getServerInfoFromFilename,
  getSiteGroupsByClient,
  getSshKeysFromClients,
  extractSshKeys,
  extractSshKeyDefinitions,
};
