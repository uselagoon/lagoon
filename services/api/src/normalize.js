// @flow

const R = require('ramda');
const { denormalize, normalize, schema } = require('normalizr');

const client = new schema.Entity('clients');

const sshKey = new schema.Entity(
  'sshKeys',
  {},
  {
    idAttribute: (value, parent, key) => {
      console.log(parent);
    },
  },
);

const siteGroup = new schema.Entity(
  'siteGroups',
  {
    client,
    ssh_keys: new schema.Values(sshKey),
  },
  {
    processStrategy: (value, parent, key) => {
      console.log(value);

      return R.reduce((acc, sg) => {
        return acc;
      }, {})(values);
    },
  },
);

const siteGroupSchema = new schema.Values(siteGroup);
const clientSchema = { ssh_keys: sshKey };

const normalizeClient = (data: Object): Object => ({});

const normalizeSiteGroup = (data: Object): Object =>
  normalize(data, siteGroupSchema);

const denormalizeSiteGroup = (entities: Object, data: Object): Object =>
  denormalize(data, siteGroupSchema, entities);

module.exports = {
  denormalizeSiteGroup,
  normalizeSiteGroup,
};
