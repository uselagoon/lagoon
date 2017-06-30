// @flow

const { getSiteFiles } = require('../../storage/sitefiles');

jest.mock('../../storage', () => ({
  readYamlFile: jest.fn(async () => ({
    drupalsites: {
      deploytest_branch1: { site_branch: 'branch1', uid: 3201, sitegroup: 'deploytest' },
    },
  })),
}));

describe('getSiteFiles', () => {
  test('returns a list of site files', async () => {
    const ret = await getSiteFiles(['compact/site1.yaml', 'compact/site2.yaml']);
    // console.log('ret', ret);
    expect(
      ret,
    ).toEqual({ 'compact/site1.yaml': { drupalsites: { deploytest_branch1: { site_branch: 'branch1', uid: 3201, sitegroup: 'deploytest' } } }, 'compact/site2.yaml': { drupalsites: { deploytest_branch1: { site_branch: 'branch1', uid: 3201, sitegroup: 'deploytest' } } } });
  });
});
