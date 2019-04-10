const path = require('path');
require('dotenv-extended').load();

const lagoonRoutes =
  (process.env.LAGOON_ROUTES && process.env.LAGOON_ROUTES.split(',')) || [];

const lagoonApiRoute = lagoonRoutes.find(route => route.includes('api-'));
const envApiRoute = process.env.GRAPHQL_API;

const lagoonKeycloakRoute = lagoonRoutes.find(routes =>
  routes.includes('keycloak-')
);
const envKeycloakRoute = process.env.KEYCLOAK_API;

const taskBlacklist =
  (process.env.LAGOON_UI_TASK_BLACKLIST &&
    process.env.LAGOON_UI_TASK_BLACKLIST.split(',')) ||
  [];

module.exports = {
  publicRuntimeConfig: {
    GRAPHQL_API: lagoonApiRoute ? `${lagoonApiRoute}/graphql` : envApiRoute,
    GRAPHQL_API_TOKEN: process.env.GRAPHQL_API_TOKEN,
    KEYCLOAK_API: lagoonKeycloakRoute
      ? `${lagoonKeycloakRoute}/auth`
      : envKeycloakRoute,
    LAGOON_UI_ICON: process.env.LAGOON_UI_ICON,
    LAGOON_UI_TASK_BLACKLIST: taskBlacklist
  },
  distDir: '../build',
  webpack(config, options) {
    config.resolve.alias['components'] = path.join(__dirname, 'components');
    config.resolve.alias['layouts'] = path.join(__dirname, 'layouts');
    config.resolve.alias['lib'] = path.join(__dirname, 'lib');
    config.resolve.alias['pages'] = path.join(__dirname, 'pages');

    const originalEntry = config.entry;
    config.entry = async () => {
      const entries = await originalEntry();

      if (
        entries['main.js'] &&
        !entries['main.js'].includes('./lib/polyfills.js')
      ) {
        entries['main.js'].unshift('./lib/polyfills.js');
      }

      return entries;
    };

    return config;
  }
};
