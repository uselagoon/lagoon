// @flow

const ApiGroup = require('kubernetes-client/lib/api-group');

class BaaS extends ApiGroup {
  constructor(options) {
    options = Object.assign({}, options, {
      path: 'apis/backup.appuio.ch',
      version: options.version || 'v1alpha1',
      groupResources: [],
      namespaceResources: ['restores'],
    });
    super(options);
  }
}

module.exports = {
  BaaS,
};
