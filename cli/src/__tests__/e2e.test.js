// @flow

import path from 'path';
import { sync as spawnSync } from 'execa';

const CLI_PATH = path.join(__dirname, '..', '..', 'bin', 'lagu.js');

describe('lagu', () => {
  it('should fail with error message without any arguments', async () => {
    const results = spawnSync(CLI_PATH, [], { reject: false });
    expect(results.code).toBe(1);
    expect(results.message).toMatch('Not enough non-option arguments');
  });

  it('should show customer details (using --project option)', async () => {
    const results = spawnSync(
      CLI_PATH,
      ['customer', '--project', 'ci-multiproject1'],
      {
        reject: false,
      },
    );
    expect(results.code).toBe(0);
    expect(results.stdout).toMatchSnapshot();
  });

  // TODO: Run this in a directory that has a fixture .lagoon.yml file
  it('should show customer details (project read from .lagoon.yml)', async () => {
    const results = spawnSync(CLI_PATH, ['customer'], {
      reject: false,
    });
    expect(results.code).toBe(0);
    expect(results.stdout).toMatchSnapshot();
  });

  // TODO: Comment in, figure out why this returns nothing (do we need GraphQL fixture data?)
  // it('should list all environments for a project (using --project option)', async () => {
  //   const results = spawnSync(CLI_PATH, ['environments', '--project', 'ci-multiproject1'], {
  //     reject: false,
  //   });
  //   expect(results.code).toBe(0);
  //   expect(results.stdout).toMatchSnapshot();
  // });
  // // TODO: Run this in a directory that has a fixture .lagoon.yml file
  // it('should list all environments for a project (project read from .lagoon.yml)', async () => {
  //   const results = spawnSync(CLI_PATH, ['environments'], {
  //     reject: false,
  //   });
  //   expect(results.code).toBe(0);
  //   expect(results.stdout).toMatchSnapshot();
  // });

  it('should show project details (using --project option)', async () => {
    const results = spawnSync(
      CLI_PATH,
      ['project', '--project', 'ci-multiproject1'],
      {
        reject: false,
      },
    );
    expect(results.code).toBe(0);
    expect(results.stdout).toMatchSnapshot();
  });

  // TODO: Run this in a directory that has a fixture .lagoon.yml file
  it('should show project details (read from .lagoon.yml)', async () => {
    const results = spawnSync(CLI_PATH, ['project'], {
      reject: false,
    });
    expect(results.code).toBe(0);
    expect(results.stdout).toMatchSnapshot();
  });

  it('should list all projects', async () => {
    const results = spawnSync(CLI_PATH, ['projects'], { reject: false });
    expect(results.code).toBe(0);
    expect(results.stdout).toMatchSnapshot();
  });
});
