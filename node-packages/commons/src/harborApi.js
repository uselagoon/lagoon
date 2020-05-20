// @flow

const axios = require('axios');
const R = require('ramda');

const HARBOUR_BASE_API_URL =
  process.env.HARBOUR_BASE_API_URL ||
  'https://harbor-nginx-lagoon-master.ch.amazee.io/api/repositories/';
const HARBOR_BASE_URL_POSTFIX = '/tags/latest/scan';
const HARBOR_ACCEPT_HEADER =
  'application/vnd.scanner.adapter.vuln.report.harbor+json; version=1.0';
const HARBOR_USERNAME = process.env.HARBOR_USERNAME || 'admin';
const HARBOR_PASSWORD = process.env.HARBOR_PASSWORD;

const getVulnerabilitiesPayloadFromHarbor = async (repoFullName, harborpassword = null) => {
  const endpoint =
    HARBOUR_BASE_API_URL + repoFullName + HARBOR_BASE_URL_POSTFIX;
console.log(Buffer.from(HARBOR_USERNAME + ':' + (HARBOR_PASSWORD || harborpassword)).toString('base64'));
  const options = {
    timeout: 30000,
    headers: {
      Accept: HARBOR_ACCEPT_HEADER,
      Authorization:
        'Basic ' +
        Buffer.from(HARBOR_USERNAME + ':' + (HARBOR_PASSWORD || harborpassword)).toString('base64'),
    },
  };

  const response = await axios.get(endpoint, options);
  return response.data;
};

module.exports = {
  getVulnerabilitiesPayloadFromHarbor,
};
