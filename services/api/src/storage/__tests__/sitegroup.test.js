// @flow

const { readSiteGroupsFile, parseSiteGroupFile } = require(
  "../../storage/sitegroup"
);

const {
  // listYamlFiles,
  // readYamlFile,
  repoPath,
} = require('..');

describe("readSiteGroupsFile", () => {
  test("should return the string content for api-test-hiera", async () => {
    const content = await readSiteGroupsFile(TEST_HIERA_REPO);
    expect(content).toMatchSnapshot();
  });
});

describe("parseSiteGroupFile", () => {
  test("", async () => {
    const content = await readSiteGroupsFile(TEST_HIERA_REPO);

    const obj = parseSiteGroupFile(content); 

    console.log(typeof obj);
  });
});
