require('dotenv-extended').load();

const lagoonApiRoute = process.env.LAGOON_ROUTES &&
  process.env.LAGOON_ROUTES.split(',').find(route => route.includes('api-'));
const envApiRoute = process.env.API;

module.exports = {
  publicRuntimeConfig: {
    API: envApiRoute || lagoonApiRoute,
    API_TOKEN: process.env.API_TOKEN,
  }
}
