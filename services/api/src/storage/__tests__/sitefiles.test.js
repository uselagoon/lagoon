// @flow

jest.mock('../../storage', () => ({
  readYamlFile: jest.fn(async () => ({
    drupalsites: {
      deploytest_branch1: {
        site_branch: 'branch1',
        uid: 3201,
        sitegroup: 'deploytest',
      },
    },
  })),
}));

const { getSiteFiles } = require('../../storage/sitefiles');

describe('getSiteFiles', () => {
  test('returns a list of site files', async () => {
    const ret = await getSiteFiles([
      'compact/site1.yaml',
      'compact/site2.yaml',
    ]);
    expect(ret).toEqual({
      'compact/site1.yaml': {
        drupalsites: {
          deploytest_branch1: {
            site_branch: 'branch1',
            uid: 3201,
            sitegroup: 'deploytest',
          },
        },
      },
      'compact/site2.yaml': {
        drupalsites: {
          deploytest_branch1: {
            site_branch: 'branch1',
            uid: 3201,
            sitegroup: 'deploytest',
          },
        },
      },
    });
  });
});
