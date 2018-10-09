require('dotenv-extended').load();

const lagoonRoutes =
  (process.env.LAGOON_ROUTES && process.env.LAGOON_ROUTES.split(',')) || [];

const lagoonApiRoute = lagoonRoutes.find(route => route.includes('api-'));
const envApiRoute = process.env.GRAPHQL_API;

const lagoonKeycloakRoute = lagoonRoutes.find(routes =>
  routes.includes('keycloak-')
);
const envKeycloakRoute = process.env.KEYCLOAK_API;

module.exports = {
  publicRuntimeConfig: {
    GRAPHQL_API: envApiRoute || lagoonApiRoute,
    KEYCLOAK_API: envKeycloakRoute || lagoonKeycloakRoute
  },
  distDir: '../build'
};
