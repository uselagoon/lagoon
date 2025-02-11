# Keycloak

Lagoon uses Keycloak to store users, handle authentication and authorization for multiple clients
(api, ui, cli, etc), and handle SSO against 3rd party identity providers.

## Upgrading

Upgrading keycloak should not be done without care. Carefully read the release and upgrade notes to
determine if any breaking changes have been made to subsystems that Lagoon relies on. This includes
how Keycloak is configured and run.

The following libraries/plugins may also require specific versions of Keycloak, or must be upgraded
at the same time as Keycloak to a supported version:

* [Home IDP Discovery plugin](https://github.com/sventorben/keycloak-home-idp-discovery)
