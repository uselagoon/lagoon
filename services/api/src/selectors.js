// @flow

const R = require('ramda');
// const getSiteFiles = require('./storage/site');
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
  getSiteGroupsByClient,
};
