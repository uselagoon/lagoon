import type { State } from './reducer';

const R = require('ramda');

const mapIndexed = R.addIndex(R.map);

const getAllSiteGroups = R.compose(
  R.map(([id, siteGroup]) => ({ ...siteGroup, id, siteGroupName: id })),
  sitegroups => Object.entries(sitegroups),
  R.propOr({}, 'siteGroups'),
);

const getAllSites = () => [];

const // console.log(state);
getSiteByName = (state, name) => R.find(site => site.siteName === name)(state.sites);

// R.find(site => site.siteName === name)(state);
module.exports = { getAllSiteGroups, getSiteByName, getAllSites };
