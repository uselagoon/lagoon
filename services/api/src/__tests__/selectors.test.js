// @flow

const { getAllSiteGroups, getAllSitesByEnv, addServerInfo, getSiteByName } = require(
  '../selectors',
);

describe('getAllSiteGroups', () => {
  test('should return a complete list of siteGroups', () => {
    const state = { siteGroups: { sg1: { gitUrl: 'git://sg1' }, sg2: { gitUrl: 'git://sg2' } } };

    const ret = getAllSiteGroups(state);

    expect(ret).toMatchSnapshot();
  });
});
// describe('addServerInfo', () => {
//   test('should return server information', () => {
//     const serverInfo = addServerInfo('compact/deploytest1.yaml');
//     expect(
//       serverInfo,
//     ).toEqual({ fileName: 'compact/deploytest1.yaml', serverInfrastructure: 'compact', serverIdentifier: 'deploytest1' });
//   });
//
//   test('should not break on deeper directory hierarchies', () => {
//     const serverInfo = addServerInfo('deep/deeper/compact/deploytest1.yaml');
//     expect(
//       serverInfo,
//     ).toEqual({ fileName: 'deep/deeper/compact/deploytest1.yaml', serverInfrastructure: 'compact', serverIdentifier: 'deploytest1' });
//   });
//   test('should return null with an invalid path', () => {
//     const serverInfo = addServerInfo('invalid/path');
//     expect(serverInfo).toEqual(null);
//   });
// });
describe('getAllSitesByEnv', () => {
  test('should return a complete list of sites', () => {
    const state = {
      siteFiles: {
        'compact/deploytest1.yaml': {
          drupalsites: {
            deploytest_branch1: {
              site_environment: 'development',
              site_branch: 'branch1',
              uid: 3201,
              sitegroup: 'deploytest',
            },
          },
        },
        'compact/deploytest2.yaml': {
          drupalsites: {
            deploytest_branch1: {
              site_environment: 'development',
              site_branch: 'branch2',
              uid: 3201,
              sitegroup: 'deploytest',
            },
          },
        },
      },
    };

    const ret = getAllSitesByEnv(state, 'development');
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
