// @flow

const { getServerInfoFromFilename, getSiteFiles, getAllSitesByEnv } = require('../../storage/site');

jest.mock('../../storage', () => ({
  readYamlFile: jest.fn(async filename => ({
    drupalsites: {
      deploytest_branch1: { site_branch: 'branch1', uid: 3201, sitegroup: 'deploytest' },
    },
  })),
}));
describe('getServerInfoFromFilename', () => {
  test('should return server information', () => {
    const serverInfo = getServerInfoFromFilename('compact/deploytest1.yaml');
    expect(
      serverInfo,
    ).toEqual({ fileName: 'compact/deploytest1.yaml', serverInfrastructure: 'compact', serverIdentifier: 'deploytest1' });
  });

  test('should not break on deeper directory hierarchies', () => {
    const serverInfo = getServerInfoFromFilename('deep/deeper/compact/deploytest1.yaml');
    expect(
      serverInfo,
    ).toEqual({ fileName: 'deep/deeper/compact/deploytest1.yaml', serverInfrastructure: 'compact', serverIdentifier: 'deploytest1' });
  });
  test('should return null with an invalid path', () => {
    const serverInfo = getServerInfoFromFilename('invalid/path');
    expect(serverInfo).toEqual(null);
  });
});

describe('getSiteFiles', () => {
  test('returns a list of site files', async () => {
    const ret = await getSiteFiles(['compact/site1.yaml', 'compact/site2.yaml']);
    // console.log('ret', ret);
    expect(
      ret,
    ).toEqual({ 'compact/site1.yaml': { drupalsites: { deploytest_branch1: { site_branch: 'branch1', uid: 3201, sitegroup: 'deploytest' } } }, 'compact/site2.yaml': { drupalsites: { deploytest_branch1: { site_branch: 'branch1', uid: 3201, sitegroup: 'deploytest' } } } });
  });
});

describe('getAllSitesByEnv', () => {
  test('returns a list of sites', async () => {
    const ret = await getAllSitesByEnv(['compact/site1.yaml', 'compact/site2.yaml']);
    expect(
      ret,
    ).toEqual([{ siteName: 'deploytest_branch1', site_branch: 'branch1', uid: 3201, sitegroup: 'deploytest' }, { siteName: 'deploytest_branch1', site_branch: 'branch1', uid: 3201, sitegroup: 'deploytest' }]);
  });
});
