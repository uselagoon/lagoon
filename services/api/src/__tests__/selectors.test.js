// @flow

const {
  filterSiteGroups,
  getAllSiteGroups,
  filterSites,
  addServerInfo,
  addServerNames,
  sanitizeCriteria,
  findSite,
  findClient,
  extractSshKeys,
  maybeAddJumpHostKey,
  addSiteHost,
  siteFileToSiteViews,
  toSiteHostStr,
  toSshKeyStr,
} = require('../selectors');

describe('Util selectors', () => {
  describe('sanitizeCriteria', () => {
    it('should transform values to equal predicate functions', () => {
      const criteria = {
        a: () => 'foo',
        b: 'test',
      };

      const ret = sanitizeCriteria(criteria);

      expect(typeof ret.a).toBe('function');
      expect(typeof ret.b).toBe('function');

      expect(ret.b('not')).toBeFalsy();
      expect(ret.b('test')).toBeTruthy();
    });

    it('should filter null / undefined values instead of creating predicates', () => {
      const criteria = {
        a: null,
        b: undefined,
        c: 'test',
      };

      const ret = sanitizeCriteria(criteria);

      expect(ret.a).toBeUndefined();
      expect(ret.b).toBeUndefined();
      expect(typeof ret.c).toBe('function');
    });
  });

  describe('toSshKeyStr', () => {
    test('should convert full specified sshKey to string', () => {
      const sshKey = {
        owner: 'o1',
        key: 'k1',
        type: ('some-type': any),
      };

      const ret = toSshKeyStr(sshKey);
      expect(ret).toEqual('some-type k1');
    });

    test('should assum ssh-rsa as type, if not given', () => {
      const sshKey = {
        owner: 'o1',
        key: 'k1',
      };

      const ret = toSshKeyStr(sshKey);
      expect(ret).toEqual('ssh-rsa k1');
    });
  });

  describe('extractSshKeys', () => {
    test('should extract the ssh_keys field of given entity', () => {
      const entity = {
        ssh_keys: {
          o1: { key: 'k1' },
          o2: { key: 'k2' },
        },
      };
      const ret = extractSshKeys(entity);

      expect(ret).toEqual([
        {
          owner: 'o1',
          key: 'k1',
          type: 'ssh-rsa',
        },
        {
          owner: 'o2',
          key: 'k2',
          type: 'ssh-rsa',
        },
      ])
    });

    test('should return an empty array on non-existing ssh_keys', () => {
      const ret1 = extractSshKeys(({}: any));
      expect(ret1).toEqual([]);

      const ret2 = extractSshKeys((null: any));
      expect(ret2).toEqual([]);
    });
  });

  describe('maybeAddJumpHostKey', () => {
    test('should eventually set jumpHost attribute', () => {
      const ret = maybeAddJumpHostKey('jumpy', {
        other: 'value',
      });

      expect(ret).toEqual({ other: 'value', jumpHost: 'jumpy' });
    });
  });

  describe('toSiteHostStr', () => {
    test('should respect the right order of the input values for concatination', () => {
      const input1 = {
        serverInfrastructure: 'compact',
        serverIdentifier: 'deploytest',
      };

      const input2: any = {
        serverInfrastructure: 'compact',
      };

      const input3: any = {
        serverIdentifier: 'deploytest',
      };

      expect(toSiteHostStr(input1)).toBe('deploytest.compact');
      expect(toSiteHostStr(input2)).toBe('');
      expect(toSiteHostStr(input3)).toBe('');
    });
  });

  describe('addSiteHost', () => {
    test('should add the siteHost attribute based on serverInfrastructure & serverIdentifier', () => {
      const ret = addSiteHost(
        null,
        ({
          serverIdentifier: 'deploytest',
          serverInfrastructure: 'compact',
          other: 'other',
        }: any)
      );
      expect(ret).toMatchSnapshot();
    });

    test('should use servername as siteHost, if provided', () => {
      const ret: any = addSiteHost(
        'some.server.name',
        ({
          serverIdentifier: 'deploytest',
          serverInfrastructure: 'compact',
        }: any)
      );
      expect(ret.siteHost).toBe('some.server.name');
    });
  });

  describe('addServerInfo', () => {
    test('should return server information', () => {
      const ret = addServerInfo({
        fileName: 'compact/deploytest1.yaml',
      });

      expect(ret).toEqual({
        fileName: 'compact/deploytest1.yaml',
        serverInfrastructure: 'compact',
        serverIdentifier: 'deploytest1',
      });
    });

    test('should not break on deeper directory hierarchies', () => {
      const ret = addServerInfo({
        fileName: 'deep/deeper/compact/deploytest1.yaml',
      });

      expect(ret).toEqual({
        fileName: 'deep/deeper/compact/deploytest1.yaml',
        serverInfrastructure: 'compact',
        serverIdentifier: 'deploytest1',
      });
    });

    test('should return the original object when fileName is invalid', () => {
      const ret = addServerInfo({
        fileName: 'invalid/path',
      });

      expect(ret).toEqual({
        fileName: 'invalid/path',
      });
    });
  });

  describe('addServerNames', () => {
    test('should calculate serverNames from cluster sites (case 1)', () => {
      const clusterMembers = {
        cluster1: '127.0.0.1',
      };

      const ret = addServerNames(
        clusterMembers,
        ({
          serverInfrastructure: 'cluster',
          siteHost: 'sitehost',
        }: any)
      );

      expect(ret).toMatchSnapshot();
    });

    test('should calculate serverNames from single sites (case 2)', () => {
      const ret = addServerNames(
        null,
        ({
          serverInfrastructure: 'single',
          siteHost: 'sitehost',
        }: any)
      );

      expect(ret).toMatchSnapshot();
    });

    test('should use siteHost as serverNames if there is no way to calculate cluster / single sites', () => {
      const ret1 = addServerNames(
        null,
        ({
          siteHost: 'sitehost',
        }: any)
      );

      const ret2 = addServerNames(
        null,
        ({
          siteHost: ['sh1', 'sh2'],
        }: any)
      );

      expect(ret1.serverNames).toEqual(['sitehost']);
      expect(ret2.serverNames).toEqual(['sh1', 'sh2']);
    });
  });
});

describe('SiteGroups related selectors', () => {
  const state = {
    siteGroupsFile: {
      amazeeio_sitegroups: {
        sg1: { client: 'c1', gitUrl: 'git://sg1' },
        sg2: { client: 'c2', gitUrl: 'git://sg2' },
      },
    },
  };

  describe('getSiteGroupsByClient', () => {
    test('should find existing sitegroups by client', () => {
      const ret = filterSiteGroups(
        {
          client: 'c1',
        },
        state
      );
      expect(ret).toMatchSnapshot();
    });
  });

  describe('getAllSiteGroups', () => {
    test('should return a complete list of siteGroups', () => {
      const ret = getAllSiteGroups(state);
      expect(ret).toMatchSnapshot();
    });
  });
});

describe('Site related selectors', () => {
  describe('siteFileToSiteViews', () => {
    test('should transform a SiteFile Yaml content to a list of SiteView objects', () => {
      const filename = 'cluster/sitefile1.yaml';
      const siteFile: any = {
        drupalsites: {
          deploytest_branch1: {
            site_environment: 'development',
            site_branch: 'branch1',
            uid: 3201,
            sitegroup: 'deploytest',
          },
        },
        'amazeeio::servername': 'arbitraryServerName',
        'drupalhosting::profiles::nginx_backend::cluster_member': {
          cluster1: '127.0.0.1',
        },
        'amazeeio::jumphost': 'jumpy',
      };

      const ret = siteFileToSiteViews(filename, siteFile);
      expect(ret).toMatchSnapshot();
    });
  });

  describe('getAllSitesByEnv', () => {
    test('should return a complete list of sites', () => {
      const state: any = {
        siteFiles: {
          'compact/deploytest1.yaml': {
            drupalsites: {
              deploytest_branch1: {
                site_environment: 'development',
                site_branch: 'branch1',
                uid: 3201,
                sitegroup: 'deploytest',
              },
            },
            'amazeeio::jumphost': 'jumpy',
          },
          'compact/deploytest2.yaml': {
            drupalsites: {
              deploytest_branch1: {
                site_environment: 'development',
                site_branch: 'branch2',
                uid: 3201,
                sitegroup: 'deploytest',
              },
            },
          },
        },
      };

      const ret = filterSites(
        {
          site_environment: 'development',
        },
        state
      );
      expect(ret).toMatchSnapshot();
    });
  });

  describe('getSiteByName', () => {
    test('should return site given a name', () => {
      const state: any = {
        siteFiles: {
          'compact/deploytest1.yaml': {
            drupalsites: {
              deploytest_branch1: {
                site_branch: 'branch1',
                uid: 3201,
                sitegroup: 'deploytest',
              },
            },
          },
          'compact/deploytest2.yaml': {
            drupalsites: {
              deploytest_branch1: {
                site_branch: 'branch2',
                uid: 3201,
                sitegroup: 'deploytest',
              },
            },
          },
        },
      };

      const ret = findSite(
        {
          siteName: 'deploytest_branch1',
        },
        state
      );
      expect(ret).toMatchSnapshot();
    });
  });
});

describe('Client based Selectors', () => {
  const state = {
    clientsFile: {
      amazeeio_clients: {
        amazeeio: {
          deploy_private_key: 'privatekey',
        },
      },
    },
  };

  describe('getClientByName', () => {
    test('should find existing client', () => {
      const ret = findClient(
        {
          clientName: 'amazeeio',
        },
        state
      );
      expect(ret).toEqual({
        clientName: 'amazeeio',
        deploy_private_key: 'privatekey',
      });
    });

    test('should return empty result on non-existing client', () => {
      const ret = findClient(
        {
          clientName: 'nonexistent',
        },
        state
      );
      expect(ret).toBeUndefined();
    });
  });
});
