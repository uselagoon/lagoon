// @flow

const {
  getCredentialsForEntities,
  getCredentials,
  createAttributeFilters,
  createAllowedQueries,
} = require('../auth');

describe('createAttributeFilters', () => {
  describe('for role "drush"', () => {
    const filters = createAttributeFilters('drush');

    test('should filter sitegroups attributes correctly', () => {
      const data: any = {
        // We just need to check if these attributes are there
        id: 'sg1',
        siteGroupName: 'sg1',
        git_url: 'giturl',
        slack: { webhook: 'webhook' },

        // Other attributes should be omitted
        client: {
          deploy_private_key: 'rsa',
        },
      };

      expect(filters.sitegroup).not.toBeNull();

      const ret = (filters: any).sitegroup(data);

      expect(ret).toEqual({
        id: 'sg1',
        siteGroupName: 'sg1',
        git_url: 'giturl',
        slack: { webhook: 'webhook' },
      });
    });

    test('should filter site attributes correctly', () => {
      const data: any = {
        id: 's1',
        site_branch: 'branch',
        site_environment: 'environment',
        deploy_strategy: 'deploy',
        webroot: 'webroot',
        domains: ['d1', 'd2'],

        siteHost: 'host',
        siteName: 's1',
        jumpHost: 'jumpy',
        serverInfrastructure: 'infra',
        serverIdentifier: 'identifier',
        serverNames: ['n1', 'n2'],

        sitegroup: 'sg1',

        // These attributes should be omitted
        ssh_keys: ['rsa'],
        sslcerttype: 'ssl',
      };

      const ret = (filters: any).site(data);

      [
        'id',
        'siteName',
        'site_branch',
        'site_environment',
        'siteHost',
        'serverInfrastructure',
        'serverIdentifier',
        'serverNames',
        'deploy_strategy',
        'webroot',
        'domains',
        'siteName',
        'jumpHost',
        'serverInfrastructure',
        'serverIdentifier',
        'serverNames',
        'sitegroup',
      ].forEach((attr) => expect(ret).toHaveProperty(attr));
    });
  });
});

describe('getCredentialsForEntities', () => {
  test('should get the proper clients', () => {
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

    const ret = getCredentialsForEntities(
      'ssh1',
      'none',
      'client',
      null,
      clients
    );

    expect(ret).toEqual(['c1', 'c3']);
  });
});

describe('getCredentials', () => {
  test('should get s1 to s5 according to inheritance rules', () => {
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
      attributeFilters: {},
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
      attributeFilters: {},
    });
  });
});

describe('createAllowedQueries', () => {
  test('should limit role "drush" to a subset of queries', () => {
    const ret = createAllowedQueries('drush');

    expect(ret).toEqual(['siteGroupByName'])
  });

  test('should not limit any other roles', () => {
    expect(createAllowedQueries('admin')).toBeUndefined();
    expect(createAllowedQueries('none')).toBeUndefined();
  });
});

