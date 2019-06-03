// @flow

const KeycloakAdmin = require('keycloak-admin').default;

// Must be initialized with `waitAndInitKeycloak`
const keycloakAdminClient = new KeycloakAdmin({
  baseUrl: 'http://keycloak:8080/auth',
  realmName: 'master',
});

module.exports = {
  keycloakAdminClient,
};
