// @flow

const R = require('ramda');
const searchguardClient = require('../../clients/searchguardClient');
const logger = require('../../logger');
const { getAllCustomerNames } = require('./helpers');

const SearchguardOperations = {
  createOrUpdateLagoonadminRole: async () => {
    const customerNames = await getAllCustomerNames();

    const tenants = R.reduce(
      (acc, elem) => {
        acc[elem] = 'RW';
        return acc;
      },
      { admin_tenant: 'RW' },
      customerNames,
    );

    try {
      // Create or Update the lagoonadmin role which has access to all tenants (all customers)
      // (individual access will be created during Project creation)
      await searchguardClient.put('roles/lagoonadmin', {
        body: {
          cluster: ['UNLIMITED'],
          indices: {
            '*': {
              '*': ['UNLIMITED'],
            },
          },
          tenants,
        },
      });
      logger.info('Created/Updated lagoonadmin role in SearchGuard');
    } catch (err) {
      logger.error(`SearchGuard Error while creating lagoonadmin role: ${err}`);
      throw new Error(
        `SearchGuard Error while creating lagoonadmin role: ${err}`,
      );
    }
  },
};

module.exports = SearchguardOperations;
