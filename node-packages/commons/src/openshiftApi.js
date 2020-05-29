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

class RouteMigration extends ApiGroup {
  constructor(options) {
    options = Object.assign({}, options, {
      path: 'apis/dioscuri.amazee.io',
      version: options.version || 'v1',
      groupResources: [],
      namespaceResources: ['routemigrates','ingressmigrates'],
    });
    super(options);
  }
}

class ServiceCatalog extends ApiGroup {
  constructor(options) {
    options = Object.assign({}, options, {
      path: 'apis/servicecatalog.k8s.io',
      version: options.version || 'v1beta1',
      groupResources: [],
      namespaceResources: ['serviceinstances', 'servicebindings'],
    });
    super(options);
  }
}

module.exports = {
  BaaS,
  ServiceCatalog,
  RouteMigration,
};
