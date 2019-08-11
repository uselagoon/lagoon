// @flow

import path from 'path';
import { parseConfigFile } from '../parseConfigFile';

const fs = require('../../util/fs');

// $FlowFixMe Jest can mutate exports https://github.com/facebook/jest/issues/936#issuecomment-214556122
fs.writeFile = jest.fn();

describe('parseConfig', () => {
  it('should parse the config correctly', async () => {
    const yamlContent = await fs.readFile(path.join(__dirname, 'lagoon.yml'));

    const config = parseConfigFile(yamlContent.toString());

    const expected = {
      project: 'amazee_io',
    };

    expect(config).toEqual(expected);
  });
});
