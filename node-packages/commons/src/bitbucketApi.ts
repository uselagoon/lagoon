import axios from 'axios';
import { find, pathOr, propEq, propOr } from 'ramda';

const API_HOST = propOr(
  'https://bitbucket.org',
  'BITBUCKET_API_HOST',
  process.env
);

const API_TOKEN = propOr(
  'personal access token',
  'BITBUCKET_API_TOKEN',
  process.env
);

const options = {
  baseURL: `${API_HOST}/rest/api/1.0/`,
  timeout: 30000,
  headers: {
    Authorization: `Bearer ${API_TOKEN}`
  }
};

const bitbucketapi = axios.create(options);

class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
  }
}

class APIError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BitbucketAPIError';
  }
}

const getRequest = async url => {
  try {
    const response = await bitbucketapi.get(url);
    return response.data;
  } catch (error) {
    if (error.response) {
      const errorMessage = pathOr(
        error.message,
        ['data', 'errors'],
        error.response
      );
      const errorString =
        typeof errorMessage === 'string'
          ? errorMessage
          : JSON.stringify(errorMessage);

      throw new APIError(errorString);
    } else if (error.request) {
      throw new NetworkError(error.message);
    } else {
      throw error;
    }
  }
};

const getAllPagesRequest = async url => {
  let start = 0;
  let moreResults = true;
  let results = [];

  do {
    try {
      const response = await bitbucketapi.get(url, {
        params: {
          limit: 100,
          start
        }
      });

      if (response.data.isLastPage) {
        moreResults = false;
      } else {
        start = response.data.nextPageStart;
      }

      results = [...results, ...response.data.values];
    } catch (error) {
      if (error.response) {
        const errorMessage = pathOr(
          error.message,
          ['data', 'errors'],
          error.response
        );
        const errorString =
          typeof errorMessage === 'string'
            ? errorMessage
            : JSON.stringify(errorMessage);

        throw new APIError(errorString);
      } else if (error.request) {
        throw new NetworkError(error.message);
      } else {
        throw error;
      }
    }
  } while (moreResults);

  return results;
};

export const searchReposByName = async name => {
  try {
    const repos = await getAllPagesRequest(
      `repos?name=${name}&permission=REPO_READ`
    );
    return find(propEq('slug', name), repos);
  } catch (e) {
    throw e;
  }
};

export const getRepoUsers = async (project, repo) =>
  getAllPagesRequest(`projects/${project}/repos/${repo}/permissions/users`);
