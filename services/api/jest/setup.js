// @flow

// Make sure to require a .env file for integration tests
require("dotenv-extended").load();

const path = require('path');

global.TEST_HIERA_REPO = path.join(__dirname, '..', '..', '..', '..', 'hiera');
