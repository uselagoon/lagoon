// @flow

import parseConfig from '../parseConfig';
import { readFile } from '../util/fs';

describe('parseConfig', () => {
  it('should parse the config correctly', async () => {
    const yamlContent = await readFile(`${__dirname}/amazeeio.yml`);

    const config = parseConfig(yamlContent.toString());

    const expected = {
      sitegroup: 'amazee_io',
      deploy_tasks: {
        development: {
          before_deploy: ['cmd1', 'cmd2'],
          after_deploy: ['cmd1', 'cmd2'],
        },
        production: {
          before_deploy: ['cmd1', 'cmd2'],
          after_deploy: ['cmd1', 'cmd2'],
        },
      },
      shared: {
        production: [{
          src: 'files',
          dst: 'sites/default/files',
        }],
      },
    };

    expect(config).toEqual(expected);
  });
});
