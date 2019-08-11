// @flow

const KeycloakAdminClient = require('keycloak-admin').default;

// Must be initialized with `waitAndInitKeycloak`
const keycloakClient = new KeycloakAdminClient({
  baseUrl: 'http://keycloak:8080/auth',
  realmName: 'master',
});

module.exports = keycloakClient;
