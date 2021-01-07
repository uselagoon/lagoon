// @flow

import axios from 'axios';
import * as R from 'ramda';

const HARBOR_BASE_API_URL =
  process.env.HARBOR_BASE_API_URL ||
  'https://harbor-nginx-lagoon-main.ch.amazee.io/api/repositories/';
const HARBOR_BASE_URL_POSTFIX = '/tags/latest/scan';
const HARBOR_ACCEPT_HEADER =
  'application/vnd.scanner.adapter.vuln.report.harbor+json; version=1.0';
const HARBOR_USERNAME = process.env.HARBOR_USERNAME || 'admin';
const HARBOR_PASSWORD = process.env.HARBOR_ADMIN_PASSWORD;

export const getVulnerabilitiesPayloadFromHarbor = async (repoFullName) => {
  const endpoint =
    HARBOR_BASE_API_URL + repoFullName + HARBOR_BASE_URL_POSTFIX;
  const options = {
    timeout: 30000,
    headers: {
      Accept: HARBOR_ACCEPT_HEADER,
      Authorization:
        'Basic ' +
        Buffer.from(HARBOR_USERNAME + ':' + (HARBOR_PASSWORD)).toString('base64'),
    },
  };

  const response = await axios.get(endpoint, options);
  return response.data;
};
