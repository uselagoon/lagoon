// @flow

import axios from 'axios';

const HARBOR_BASE_API_URL =
  process.env.HARBOR_BASE_API_URL ||
  'https://harbor-nginx-lagoon-master.ch.amazee.io';
const HARBOR_BASE_URL_POSTFIX = '/tags/latest/scan';
const HARBOR_ACCEPT_HEADER =
  'application/vnd.scanner.adapter.vuln.report.harbor+json; version=1.0';
const HARBOR_USERNAME = process.env.HARBOR_USERNAME || 'admin';
const HARBOR_PASSWORD = process.env.HARBOR_ADMIN_PASSWORD;
const HARBOR_API_VERSION = process.env.HARBOR_API_VERSION || 'v2.0';

export const getVulnerabilitiesPayloadFromHarbor = async (repository, configOverrides) => {

  let endpoint = `${HARBOR_BASE_API_URL}/api/repositories/${repository.repo_full_name}/tags/latest/scan`; //assume v1 by default
  if(HARBOR_API_VERSION != 'v1.0') {
    endpoint = `${HARBOR_BASE_API_URL}/api/v2.0/projects/${repository.namespace}/repositories/${encodeURIComponent(repository.name)}/artifacts/latest/additions/vulnerabilities`
  }

  return await getVulnerabilitiesPayloadFromHarborDriver(endpoint, configOverrides)
}

/**
 *
 * @param repoFullName
 * @param configOverrides allows us to override call details {authUsername, authPassword, acceptHeader}
 * @returns
 */
const getVulnerabilitiesPayloadFromHarborDriver = async (endpoint, configOverrides) => {

  const username = configOverrides.authUsername || HARBOR_USERNAME;
  const password = configOverrides.authPassword || HARBOR_PASSWORD;
  const acceptHeader = configOverrides.acceptHeader || HARBOR_ACCEPT_HEADER;
  const options = {
    timeout: 30000,
    headers: {
      Accept: acceptHeader,
      Authorization:
        'Basic ' +
        Buffer.from(username + ':' + (password)).toString('base64'),
    },
  };

  const response = await axios.get(endpoint, options);
  return response.data;
};
