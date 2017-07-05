// @flow

import type { State } from '../types';

const {
  getSiteGroupsByClient,
  getAllSiteGroups,
  getAllSitesByEnv,
  addServerInfo,
  addServerNames,
  getSiteByName,
  getClientByName,
  extractSshKeys,
  maybeAddJumpHostKey,
  addSiteHost,
  siteFileToSiteViews,
  toSiteHostStr,
} = require('../selectors');

describe('Util selectors', () => {
  describe('extractSshKeys', () => {
    test('should extract the ssh_keys field of given entity', () => {
      const entity = {
        ssh_keys: {
          k1: { key: 'k1key' },
          k2: { key: 'k2key' },
        },
      };
      const ret = extractSshKeys(entity);
      expect(ret).toMatchSnapshot();
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
      const ret = addSiteHost({
        serverIdentifier: 'deploytest',
        serverInfrastructure: 'compact',
        other: 'other',
      });
      expect(ret).toMatchSnapshot();
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
      const ret = addServerNames({
        serverInfrastructure: 'cluster',
        siteHost: 'sitehost',
        'drupalhosting::profiles::nginx_backend::cluster_member': {
          cluster1: '127.0.0.1',
        },
      });

      expect(ret).toMatchSnapshot();
    });

    test('should calculate serverNames from single sites (case 2)', () => {
      const ret = addServerNames({
        serverInfrastructure: 'single',
        siteHost: 'sitehost',
      });

      expect(ret).toMatchSnapshot();
    });

    test('should use siteHost as serverNames if there is no way to calculate cluster / single sites', () => {
      const ret1 = addServerNames({
        siteHost: 'sitehost',
      });

      const ret2 = addServerNames({
        siteHost: ['sh1', 'sh2'],
      });

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
      const ret = getSiteGroupsByClient(state, 'c1');
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
      const filename = 'compact/sitefile1.yaml';
      const siteFile: any = {
        drupalsites: {
          deploytest_branch1: {
            site_environment: 'development',
            site_branch: 'branch1',
            uid: 3201,
            sitegroup: 'deploytest',
          },
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

      const ret = getAllSitesByEnv(state, 'development');
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

      const ret = getSiteByName(state, 'deploytest_branch1');
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
      const ret = getClientByName(state, 'amazeeio');
      expect(ret).toEqual({
        client_name: 'amazeeio',
        deploy_private_key: 'privatekey',
      });
    });

    test('should return empty result on non-existing client', () => {
      const ret = getClientByName(state, 'nonexistent');
      expect(ret).toBeUndefined();
    });
  });
});
