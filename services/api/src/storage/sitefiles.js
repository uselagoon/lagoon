// @flow

import type { SiteFiles } from '../types';

const R = require('ramda');
const { readYamlFile } = require('.');

const getSiteFiles = async (siteFilePaths: Array<string>): SiteFiles =>
  R.reduce(
    async (acc, filePath) =>
      Object.assign({}, await acc, {
        [filePath]: await readYamlFile(filePath),
      }),
    {},
    siteFilePaths
  );

module.exports = { getSiteFiles };
