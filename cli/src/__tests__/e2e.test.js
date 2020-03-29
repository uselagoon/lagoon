// @flow

import fs from 'fs';
import path from 'path';
import R from 'ramda';
import { sync as spawnSync } from 'execa';

const CLI_PATH = path.join(__dirname, '..', '..', 'bin', 'lagu.js');
const cwd = path.join(__dirname, 'fixtures');
const tokenPath = path.join(cwd, '.lagoon-token');

const stripCreatedDates = R.replace(
  /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g,
  '                   ',
);

describe('lagu', () => {
  it('should fail with error message without any arguments', async () => {
    const results = spawnSync(CLI_PATH, [], {
      cwd,
      reject: false,
    });
    expect(results.code).toBe(1);
    expect(results.message).toMatch('Not enough non-option arguments');
  });

  it('should init', async () => {
    const results = spawnSync(
      CLI_PATH,
      [
        'init',
        '--overwrite',
        '--token',
        tokenPath,
        '--project',
        'ci-github',
        '--api',
        'http://localhost:3000',
        '--ssh',
        'localhost:2020',
      ],
      {
        cwd,
      },
    );
    expect(results.code).toBe(0);
    expect(results.stdout).toMatchSnapshot();
  });

  it('should not error on logout when not logged in', async () => {
    const results = spawnSync(CLI_PATH, ['logout'], {
      cwd,
    });
    expect(results.code).toBe(0);
    expect(results.stdout).toMatchSnapshot();
  });

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
    // Test whether token file has JWT header
    const tokenHeader = R.compose(
      R.nth(0),
      R.split('.'),
    )(fs.readFileSync(tokenPath, 'utf8'));
    expect(tokenHeader).toMatch(/^eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9$/);
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
    expect(stripCreatedDates(results.stdout)).toMatchSnapshot();
  });

  it('should show customer details (project read from .lagoon.yml)', async () => {
    const results = spawnSync(CLI_PATH, ['customer'], {
      cwd,
    });
    expect(results.code).toBe(0);
    expect(stripCreatedDates(results.stdout)).toMatchSnapshot();
  });

  it('should list all environments for a project (using --project option)', async () => {
    const results = spawnSync(
      CLI_PATH,
      ['environments', '--project', 'ci-github'],
      {
        cwd,
      },
    );
    expect(results.code).toBe(0);
    expect(stripCreatedDates(results.stdout)).toMatchSnapshot();
  });

  it('should list no environments for a project with none (using --project option)', async () => {
    const results = spawnSync(
      CLI_PATH,
      ['environments', '--project', 'ci-multiproject1'],
      {
        cwd,
      },
    );
    expect(results.code).toBe(0);
    expect(stripCreatedDates(results.stdout)).toMatchSnapshot();
  });

  it('should log an error for a non-existent project (using --project option)', async () => {
    const results = spawnSync(
      CLI_PATH,
      ['environments', '--project', 'non-existent-project'],
      {
        cwd,
      },
    );
    expect(results.code).toBe(0);
    expect(stripCreatedDates(results.stdout)).toMatchSnapshot();
  });

  it('should list all environments for a project (project read from .lagoon.yml)', async () => {
    const results = spawnSync(CLI_PATH, ['environments'], { cwd });
    expect(results.code).toBe(0);
    expect(stripCreatedDates(results.stdout)).toMatchSnapshot();
  });

  it('should show project details (read from .lagoon.yml)', async () => {
    const results = spawnSync(CLI_PATH, ['project'], {
      cwd,
    });
    expect(results.code).toBe(0);
    expect(stripCreatedDates(results.stdout)).toMatchSnapshot();
  });

  it('should list all projects', async () => {
    const results = spawnSync(CLI_PATH, ['projects'], {
      cwd,
    });
    expect(results.code).toBe(0);
    expect(stripCreatedDates(results.stdout)).toMatchSnapshot();
  });

  it('should create a project', async () => {
    const results = spawnSync(
      CLI_PATH,
      [
        'project',
        'create',
        '--customer',
        '3',
        '--name',
        'e2e-test-project',
        '--gitUrl',
        'ssh://git@172.17.0.1:2222/git/e2e-test-project.git',
        '--openshift',
        '2',
        '--branches',
        'true',
        '--pullrequests',
        'true',
        '--productionEnvironment',
        'master',
      ],
      {
        cwd,
      },
    );
    expect(results.code).toBe(0);
    expect(stripCreatedDates(results.stdout)).toMatchSnapshot();
  });

  it('should show newly-created project details (using --project option)', async () => {
    const results = spawnSync(
      CLI_PATH,
      ['project', '--project', 'e2e-test-project'],
      {
        cwd,
      },
    );
    expect(results.code).toBe(0);
    expect(stripCreatedDates(results.stdout)).toMatchSnapshot();
  });

  it('should list the new project among all projects', async () => {
    const results = spawnSync(CLI_PATH, ['projects'], {
      cwd,
    });
    expect(results.code).toBe(0);
    expect(stripCreatedDates(results.stdout)).toMatchSnapshot();
  });

  it('should delete the project', async () => {
    const results = spawnSync(
      CLI_PATH,
      ['project', 'delete', '--project', 'e2e-test-project'],
      {
        cwd,
      },
    );
    expect(results.code).toBe(0);
    expect(results.stdout).toMatchSnapshot();
  });

  it('should not show deleted project details (using --project option)', async () => {
    const results = spawnSync(
      CLI_PATH,
      ['project', '--project', 'e2e-test-project'],
      {
        cwd,
      },
    );
    expect(results.code).toBe(0);
    expect(stripCreatedDates(results.stdout)).toMatchSnapshot();
  });

  it('should log out when logged in', async () => {
    const results = spawnSync(CLI_PATH, ['logout'], {
      cwd,
    });
    expect(results.code).toBe(0);
    expect(results.stdout).toMatchSnapshot();
  });
});
