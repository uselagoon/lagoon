// @flow

const { getAllSiteGroups, getSiteByName } = require('../selectors');

describe('getAllSiteGroups', () => {
  test('should return a list of getAllSiteGroups', () => {
    const state = { siteGroups: { sg1: { gitUrl: 'git://sg1' }, sg2: { gitUrl: 'git://sg2' } } };

    const ret = getAllSiteGroups(state);

    expect(ret).toMatchSnapshot();
  });
});

describe('getSiteByName', () => {
  test('should return site given a name', () => {
    const state = {
      siteFiles: {
        'compact/deploytest1.yaml': {
          drupalsites: {
            deploytest_branch1: { site_branch: 'branch1', uid: 3201, sitegroup: 'deploytest' },
          },
        },
        'compact/deploytest2.yaml': {
          drupalsites: {
            deploytest_branch1: { site_branch: 'branch2', uid: 3201, sitegroup: 'deploytest' },
          },
        },
      },
    };

    const ret = getSiteByName(state, 'deploytest_branch1');
    expect(ret).toEqual(state.siteFiles['compact/deploytest1.yaml'].drupalsites.deploytest_branch1);
  });
});
