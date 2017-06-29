// @flow

const R = require('ramda');
// const getSiteFiles = require('./storage/site');
const getAllSiteGroups = R.compose(
  R.map(([id, siteGroup]) => ({ ...siteGroup, id, siteGroupName: id })),
  sitegroups => Object.entries(sitegroups),
  R.propOr({}, 'siteGroups'),
);

const getAllSites = () => [];

// const getSiteNameById = id => getSiteFiles(repoPath);
const getSiteByName = (state, name) =>
  Object
    .values(state.siteFiles)
    .map(
      file =>
        Object
          .entries(file.drupalsites)
          .find(([siteName, site]) => siteName === name ? site : null)[1],
    )[0];
// const getSiteByName = (state, name) => R.find(site => site.siteName === name)(state.siteFiles);
// R.find(site => site.siteName === name)(state);
module.exports = { getAllSiteGroups, getSiteByName, getAllSites };
