// @flow

const { logger } = require('@lagoon/commons/src/local-logging');
const { addProblem } = require('@lagoon/commons/src/api');

async function addAProblem(id, environment, identifier, severity, source, severityScore, data) {
    try {
      return addProblem(id, environment, identifier, severity, source, severityScore, data);
    }
    catch (error) {
      console.log(error);
   }
};

module.exports = addAProblem;