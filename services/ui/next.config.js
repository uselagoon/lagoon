require('dotenv-extended').load();

module.exports = {
  publicRuntimeConfig: {
    API: process.env.API,
    API_TOKEN: process.env.API_TOKEN,
  }
}
