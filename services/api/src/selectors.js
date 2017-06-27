// @flow

const R = require('ramda');

const getAllSiteGroups = R.compose(
  R.map(([ id, siteGroup ]) => ({ ...siteGroup, id, site_group_name: id })),
  Object.entries,
  R.propOr({}, 'siteGroups'),
);

const getAllSites = () => [];

const getSiteByName = (state, name) =>
  R.find(site => site.siteName === name)(state.sites);

const getAllClients = R.compose(
  R.map(([ id, client ]) => ({ ...client, id, client_name: id })),
  Object.entries,
  R.propOr({}, 'clients'),
);

const getClientByName = (state, name) =>
  R.compose(R.find(client => client.client_name === name), getAllClients)(
    state,
  );

const getSiteGroupsByClient = (state, client) =>
  R.compose(
    R.filter(siteGroup => siteGroup.client === client.client_name),
    getAllSiteGroups,
  )(state);

module.exports = {
  getAllSiteGroups,
  getSiteByName,
  getAllSites,
  getAllClients,
  getClientByName,
  getSiteGroupsByClient,
};
