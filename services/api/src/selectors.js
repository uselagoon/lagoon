// @flow

const R = require('ramda');

function addServerInfo(site) {
  if (!site.computed.fileName) return null;
  const matches = site.computed.fileName.match(/([^/]+)\/([^/.]+)\.[^/.]+$/);
  return matches
    ? {
      ...site,
      computed: {
        ...site.computed,
        fileName: site.computed.fileName,
        serverInfrastructure: matches[1],
        serverIdentifier: matches[2],
      },
    }
    : null;
}

function addSiteHost(site) {
  const siteHost = R.propOr(
    `${site.computed.serverIdentifier}.${site.computed.serverInfrastructure}`,
    'amazeeio::servername',
  )(site);
  return { ...site, computed: { ...site.computed, siteHost } };
}

function addServerNames(site) {
  let serverNames;
  const CLUSTER_MEMBER_KEY = 'drupalhosting::profiles::nginx_backend::cluster_member';
  if (site.computed.serverInfrastructure === 'cluster' && site[CLUSTER_MEMBER_KEY]) {
    serverNames = Object
      .keys(site[CLUSTER_MEMBER_KEY])
      .map(memberKey => `${memberKey}.${site.computed.siteHost}`);
  } else if (site.computed.serverInfrastructure === 'single') {
    serverNames = [`backend.${site.computed.siteHost}`];
  } else {
    serverNames = site.computed.siteHost instanceof Array
      ? site.computed.siteHost
      : [site.computed.siteHost];
  }
  return { ...site, computed: { ...site.computed, serverNames } };
}

function maybeAddJumphostKey(site) {
  return { ...site, computed: { ...site.computed, jumpHost: R.prop('amazeeio::jumphost', site) } };
}

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

const getSshKeysFromClients = R.compose(R.flatten, R.map(extractSshKeys));

const getAllSiteGroups = R.compose(
  R.map(([id, siteGroup]) => ({ ...siteGroup, id, site_group_name: id })),
  Object.entries,
  R.propOr({}, 'siteGroups'),
);

const getAllSitesByEnv = ({ siteFiles }, env) => R.compose(
  // Add `jumpHost` to site computed properties if key exists in yaml content
  R.map(maybeAddJumphostKey),
  // Add `serverNames` to site computed properties
  R.map(addServerNames),
  // Add `siteHost` to site computed properties
  R.map(addSiteHost),
  // Add `id` to site computed properties
  R.map(site => ({
    ...site,
    computed: {
      ...site.computed,
      id: `${site.computed.serverIdentifier}.${site.computed.serverInfrastructure}/${site.computed.siteName}`,
    },
  })),
  // Add `serverInfrastructure` and `serverIdentifier` to site computed properties
  R.map(addServerInfo),
  // Add `siteName` to site computed properties
  R.map(([siteName, site]) => ({ ...site, computed: { ...site.computed, siteName } })),
  // Filter out sites that don't match the passed environment
  R.filter(([, site]) => site.site_environment === env),
  // Remove a level of nesting
  R.unnest,
  // Move fileName to the site object
  R.map(
    ([fileName, sitePairs]) =>
      R.map(sitePair => [sitePair[0], { ...sitePair[1], computed: { fileName } }])(sitePairs),
  ),
  // Get all sites data from `drupalsites` key
  R.map(([fileName, file]) => [fileName, R.toPairs(file.drupalsites)]),
  // Get all names and yaml contents of all files
  R.toPairs,
)(siteFiles);

const getSiteByName = ({ siteFiles }, name) =>
  R.compose(
    R.head,
    R.reduce(
      (acc, curr) => [
        ...acc,
        R.compose(R.last, R.find(([siteName, site]) => siteName === name ? site : []), R.toPairs)(
          curr.drupalsites,
        ),
      ],
      [],
    ),
    R.values,
  )(siteFiles);

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
  addServerInfo,
  getSiteGroupsByClient,
  getSshKeysFromClients,
  extractSshKeys,
  extractSshKeyDefinitions,
};
