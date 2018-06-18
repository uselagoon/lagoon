// @flow

import path from 'path';
import { sync as spawnSync } from 'execa';

const CLI_PATH = path.join(__dirname, '..', '..', 'bin', 'lagu.js');
const cwd = path.join(__dirname, 'fixtures');

describe('lagu', () => {
  it('should fail with error message without any arguments', async () => {
    const results = spawnSync(CLI_PATH, [], {
      cwd,
      reject: false,
    });
    expect(results.code).toBe(1);
    expect(results.message).toMatch('Not enough non-option arguments');
  });

  // TODO: Deal with this in a way that doesn't modify global login state
  it('should log out', async () => {
    const results = spawnSync(CLI_PATH, ['logout'], {
      cwd,
    });
    expect(results.code).toBe(0);
    expect(results.stdout).toMatchSnapshot();
  });

  // TODO: Deal with this in a way that doesn't modify global login state
  it('should log in', async () => {
    const results = spawnSync(
      CLI_PATH,
      [
        'login',
        '--identity',
        path.join('..', '..', '..', '..', 'local-dev', 'cli_id_rsa'),
      ],
      {
        cwd,
      },
    );
    expect(results.code).toBe(0);
    expect(results.stdout).toMatchSnapshot();
  });

  it('should show customer details (using --project option)', async () => {
    const results = spawnSync(
      CLI_PATH,
      ['customer', '--project', 'ci-multiproject1'],
      {
        cwd,
      },
    );
    expect(results.code).toBe(0);
    expect(results.stdout).toMatchSnapshot();
  });

  // TODO: Run this in a directory that has a fixture .lagoon.yml file
  it('should show customer details (project read from .lagoon.yml)', async () => {
    const results = spawnSync(CLI_PATH, ['customer'], {
      cwd,
    });
    expect(results.code).toBe(0);
    expect(results.stdout).toMatchSnapshot();
  });

  // TODO: Comment in, figure out why this returns nothing (do we need GraphQL fixture data?)
  // it('should list all environments for a project (using --project option)', async () => {
  //   const results = spawnSync(CLI_PATH, ['environments', '--project', 'ci-multiproject1'], {
  // cwd} );
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
        cwd,
      },
    );
    expect(results.code).toBe(0);
    expect(results.stdout).toMatchSnapshot();
  });

  // TODO: Run this in a directory that has a fixture .lagoon.yml file
  it('should show project details (read from .lagoon.yml)', async () => {
    const results = spawnSync(CLI_PATH, ['project'], {
      cwd,
    });
    expect(results.code).toBe(0);
    expect(results.stdout).toMatchSnapshot();
  });

  it('should list all projects', async () => {
    const results = spawnSync(CLI_PATH, ['projects'], {
      cwd,
    });
    expect(results.code).toBe(0);
    expect(results.stdout).toMatchSnapshot();
  });
});
