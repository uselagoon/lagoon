// @flow

import type { SshKeys } from './types';

const R = require('ramda');
const { normalize, schema } = require('normalizr');

const client = new schema.Entity('clients');

const sshKey = new schema.Entity(
  'sshKeys',
  {},
  {
    processStrategy: value =>
      // Ssh-Keys are context dependent (e.g. sshKey in sitegroup | site)
      // but we need to stay consistent with the yaml structure, so we
      // need to eliminate the `id` attribute again
      R.omit(['id'], value),
  },
);

// const renameSshKeys = (relName: string, sshKeys: SshKeys): SshKeys =>
//   R.compose(
//     R.fromPairs,
//     R.map(([personName, sshKey]) => [`${relName}/${personName}`, sshKey]),
//     R.toPairs,
//   )(sshKeys);

const addSshKeyId = (
  ctx: 'site' | 'sitegroup' | 'client',
  relName: string,
  sshKeys: SshKeys,
): SshKeys =>
  R.mapObjIndexed((sshKeyObj, personName) => ({
    ...sshKeyObj,
    id: [ctx, relName, personName].join('/'),
  }))(sshKeys);

const siteGroupObj = new schema.Entity(
  'siteGroups',
  {
    client,
    ssh_keys: [sshKey],
  },
  {
    idAttribute: (value, parent, sgName) => sgName,
    processStrategy: (value, parent, sgName) => {
      // We need to add a computed `id` attribute to the sshKey,
      // so we know the context of the key itself
      // e.g sitegroup = 'deploytest1' & sshKey = 'pat' => 'deploytest1/pat'
      // To maintain consistency with the yaml file content, we need to omit
      // the id attribute in the ssh key normalization process (see sshKey schema)
      const sshKeys = addSshKeyId('sitegroup', sgName, value.ssh_keys);

      return { ...value, ssh_keys: sshKeys };
    },
  },
);

const siteGroupObjSchema = new schema.Values(siteGroupObj);

// const clientSchema = { ssh_keys: sshKey };

// const normalizeClient = (data: Object): Object => ({});

const normalizeSiteGroupObj = (data: Object): Object =>
  normalize(data, siteGroupObjSchema);

// const denormalizeSiteGroup = (entities: Object, data: Object): Object =>
//   denormalize(data, siteGroupFileSchema, entities);

module.exports = {
  // denormalizeSiteGroup,
  normalizeSiteGroupObj,
};
