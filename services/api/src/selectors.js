// @flow

const R = require('ramda');

const getAllSiteGroups = R.compose(
  R.map(([id, siteGroup]) => ({ ...siteGroup, id, siteGroupName: id })),
  sitegroups => Object.entries(sitegroups),
  R.propOr({}, 'siteGroups'),
);

const getAllSites = () => [];

const getSiteByName = (state, name) => R.find(site => site.siteName === name)(state.sites);

// R.find(site => site.siteName === name)(state);
module.exports = { getAllSiteGroups, getSiteByName, getAllSites };
