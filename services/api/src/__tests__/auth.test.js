// @flow

const { getCredentialsForEntities, getCredentials } = require('../auth');

describe('getCredentialsForEntities', () => {
  it('should get the proper clients', () => {
    const clients: any = {
      c1: {
        ssh_keys: {
          u1: { key: 'ssh1' },
        },
      },
      c2: {
        ssh_keys: {
          u2: { key: 'nope' },
        },
      },
      c3: {
        ssh_keys: {
          u3: { key: 'nope' },
          u4: { key: 'ssh1' },
        },
      },
    };

    const sshKey = 'ssh1';

    const ret = getCredentialsForEntities('ssh1', 'none', null, clients);

    expect(ret).toEqual(['c1', 'c3']);
  });
});

describe('getCredentials', () => {
  it('should get s1 to s5 according to inheritance rules', () => {
    const state = {
      clientsFile: {
        amazeeio_clients: ({
          c1: {},
          c2: {
            ssh_keys: {
              u2: { key: 'ssh1' },
            },
          },
          c3: {},
        }: any),
      },
      siteGroupsFile: {
        amazeeio_sitegroups: ({
          sg1: {
            client: 'c1',
          },
          sg2: {
            client: 'c2',
          },
          sg3: {
            client: 'c3',
            ssh_keys: {
              u1: { key: 'ssh1' },
            },
          },
        }: any),
      },
      siteFiles: ({
        'sites1.yaml': {
          drupalsites: {
            s1: {
              sitegroup: 'sg1',
              ssh_keys: {
                u1: { key: 'ssh1' },
              },
            },
            s2: {
              sitegroup: 'sg2',
            },
            s3: {
              sitegroup: 'sg2',
            },
          },
        },
        'sites2.yaml': {
          drupalsites: {
            s4: {
              sitegroup: 'sg2',
            },
            s5: {
              sitegroup: 'sg3',
            },
          },
        },
      }: any),
    };

    const ret = getCredentials('ssh1', 'none', state);

    expect(ret).toEqual({
      clients: ['c2'],
      sitegroups: ['sg2', 'sg3'],
      sites: ['s1', 's2', 's3', 's4', 's5'],
      role: 'none',
    });
  });

  test('should return all credentials for a role = "admin"', () => {
    const state = {
      clientsFile: {
        amazeeio_clients: ({
          c1: {},
          c2: {},
          c3: {},
        }: any),
      },
      siteGroupsFile: {
        amazeeio_sitegroups: ({
          sg1: {},
          sg2: {},
          sg3: {},
        }: any),
      },
      siteFiles: ({
        'sites1.yaml': {
          drupalsites: {
            s1: {
              sitegroup: 'sg1',
            },
            s2: {
              sitegroup: 'sg2',
            },
            s3: {
              sitegroup: 'sg2',
            },
          },
        },
        'sites2.yaml': {
          drupalsites: {
            s4: {
              sitegroup: 'sg2',
            },
            s5: {
              sitegroup: 'sg3',
            },
          },
        },
      }: any),
    };

    const ret = getCredentials('ssh1', 'admin', state);

    expect(ret).toEqual({
      clients: ['c1', 'c2', 'c3'],
      sitegroups: ['sg1', 'sg2', 'sg3'],
      sites: ['s1', 's2', 's3', 's4', 's5'],
      role: 'admin',
    });
  });
});
