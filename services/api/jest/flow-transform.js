const flowRemoveTypes = require('flow-remove-types');

function process(src) {
  return flowRemoveTypes(src).toString();
}

module.exports = { process };
