// @flow

const R = require('ramda');
const { readYamlFile } = require('.');

const getSiteFiles = async (siteFilePaths: Array<string>) =>
  R.reduce(
    async (acc, filePath) => ({ ...(await acc), [filePath]: await readYamlFile(filePath) }),
    {},
    siteFilePaths,
  );

module.exports = { getSiteFiles };
