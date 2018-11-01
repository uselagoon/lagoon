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
    GRAPHQL_API_TOKEN: process.env.GRAPHQL_API_TOKEN,
    KEYCLOAK_API: envKeycloakRoute || lagoonKeycloakRoute,
    LAGOON_UI_ICON: process.env.LAGOON_UI_ICON
  },
  distDir: '../build'
};
