// @flow

/* eslint-disable no-undef */

const path = require('path');
const {
  siteGroupsFilePath,
  readSiteGroupsFile,
  parseSiteGroupsFile,
} = require('../../storage/sitegroup');

const HIERA_REPO = path.join(__dirname, '__fixtures__', 'hiera1');

describe('siteGroupsFilePath', () => {
  test('should return a proper filepath to the sitegroup YAML', () => {
    const p = siteGroupsFilePath(HIERA_REPO);
    expect(p).toEqual(path.join(HIERA_REPO, 'amazeeio', 'sitegroups.yaml'));
  });
});

describe('readSiteGroupsFile', () => {
  test('should return the string content for api-test-hiera', async () => {
    const content = await readSiteGroupsFile(HIERA_REPO);
    expect(content).toMatchSnapshot();
  });
});

describe('parseSiteGroupsFile', () => {
  test('should return a parsed sitegroup YAML as JS object', async () => {
    const content = await readSiteGroupsFile(HIERA_REPO);

    const obj = parseSiteGroupsFile(content);
    expect(obj).toMatchSnapshot();
  });
});
