// Useful for skipping babel for jest :-)
// See: https://github.com/flowtype/flow-remove-types/issues/42

/*

  Example config in e.g. "./services/webhook-handler/package.json":

  "jest": {
    "rootDir": "src",
    "testEnvironment": "node",
    "transform": {
      "\\.js$": "../../../node-packages/lagoon-commons/src/jest-flow-transform"
    }
  }

  Note that there is three layers of `../` since the jest process will run in the `src`
  directory of the target project.
*/

const flowRemoveTypes = require('flow-remove-types');

module.exports = {
  process(src) {
    return flowRemoveTypes(src).toString();
  },
};
