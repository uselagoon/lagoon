// @flow

const { normalizeSiteGroupObj } = require('../normalize');

describe.skip('normalizeClient', () => {
  test('should normalize sitegroup in client', () => {});
});

// describe.skip('normalizeSiteGroups', () => {
//   test('should normalize client in sitegroup', () => {
//     const sitegroups = {
//       sg1: {
//         client: 'c1',
//       },
//     };
//   });
// });

// describe('denormalizeSiteGroup', () => {
//   test('should contain denormalized client information in sitegroup', () => {
//     const entities = {
//       clients: {
//         c1: { a: 'a' },
//       },
//       sshKeys: {
//         s1: {},
//       },
//     };

//     const data = {
//       client: 'c1',
//       git_url: 'git://url',
//     };

//     const ret = denormalizeSiteGroup(entities, data);

//     expect(ret).toEqual({
//       client: { a: 'a' },
//       git_url: 'git://url',
//     });
//   });
// });

describe.skip('normalizeSiteGroupObj', () => {
  test('should normalize sshKeys in siteGroup', () => {
    const data = {
      sg1: {
        client: 'c1',
        git_url: 'git://url',
        ssh_keys: {
          person1: {
            key: 'person1key',
          },
          person2: {
            key: 'person2key',
          },
        },
      },
    };

    const ret = normalizeSiteGroupObj(data);

    expect(ret).toEqual({
      entities: {
        sshKeys: {
          sg1_person1: {
            person1: {
              key: 'person1key',
            },
          },
          sg1_person2: {
            person2: {
              key: 'person2key',
            },
          },
        },
      },
      result: {
        client: 'c1',
        git_url: 'git://url',
        ssh_keys: ['sitegroup/sg1/person1', 'sitegroup/sg1/person2'],
      },
    });
  });
});
