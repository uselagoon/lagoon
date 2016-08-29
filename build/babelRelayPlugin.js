const schema = require('../data/schema.json');
const getBabelPlugin = require('babel-relay-plugin');

const plugin = getBabelPlugin(schema.data);

module.exports = plugin;
