// @flow

const axios = require('axios');
const R = require('ramda');

const API_HOST = R.propOr(
  'http://gitlab',
  'GITLAB_API_HOST',
  process.env,
);
const API_TOKEN = R.propOr(
  'personal access token',
  'GITLAB_API_TOKEN',
  process.env,
);

const options = {
  baseURL: `${API_HOST}/api/v4/`,
  timeout: 30000,
  headers: {
    'Private-Token': API_TOKEN,
  },
};

const gitlabapi = axios.create(options);

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

class APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitLabAPIError';
  }
}

const getRequest = async (url: string): Object => {
  try {
    const response = await gitlabapi.get(url);
    return response.data;
  } catch (error) {
    if (error.response) {
      const errorMessage = R.pathOr(error.message, ['data', 'message'], error.response);
      const errorString = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);

      throw new APIError(errorString);
    } else if (error.request) {
      throw new NetworkError(error.message);
    } else {
      throw error;
    }
  }
};

const postRequest = async (url: string, body: object): Object => {
  try {
    const response = await gitlabapi.post(url, body);
    return response.data;
  } catch (error) {
    if (error.response) {
      const errorMessage = R.pathOr(error.message, ['data', 'message'], error.response);
      const errorString = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);

      throw new APIError(errorString);
    } else if (error.request) {
      throw new NetworkError(error.message);
    } else {
      throw error;
    }
  }
};

const getAllPagesRequest = async (url: string): Promise<Array<Object>> => {
  let page = 1;
  let moreResults = true;
  let results = [];

  do {
    try {
      const response = await gitlabapi.get(url, {
        params: {
          per_page: 100,
          page,
        },
      });

      if (response.data.length === 0) {
        moreResults = false;
      } else {
        page++;
        results = [
          ...results,
          ...response.data,
        ];
      }
    } catch (error) {
      if (error.response) {
        const errorMessage = R.pathOr(error.message, ['data', 'message'], error.response);
        const errorString = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);

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

const getUserByUsername = async (username: string): Object => {
  try {
    const response = await gitlabapi.get('users', {
      params: {
        username,
      },
    });

    if (response.data.length === 0) {
      throw new APIError(`No user found with username: ${username}`);
    }

    return response.data[0];
  } catch (error) {
    if (error.response) {
      const errorMessage = R.pathOr(error.message, ['data', 'message'], error.response);
      const errorString = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);

      throw new APIError(errorString);
    } else if (error.request) {
      throw new NetworkError(error.message);
    } else {
      throw error;
    }
  }
};

const getAllGroups = async () => getAllPagesRequest('groups');
const getGroup = async (groupId: number): Object =>
  getRequest(`groups/${groupId}`);
const getGroupMembers = async (groupId: number): Promise<Array<Object>> =>
  getRequest(`groups/${groupId}/members`);
const getAllProjects = async (): Object => getAllPagesRequest('projects');
const getProject = async (projectId: number): Object =>
  getRequest(`projects/${projectId}`);
const getProjectMembers = async (projectId: number): Promise<Array<Object>> =>
  getRequest(`projects/${projectId}/members`);
const getAllUsers = async () => getAllPagesRequest('users');
const getUser = async (userId: number): Object => getRequest(`users/${userId}`);
const getSshKey = async (keyId: number): Object =>
  getRequest(`keys/${keyId}`);


const addDeployKeyToProject = async (projectId: Number, key: string): Object =>
  postRequest(`projects/${projectId}/deploy_keys`, {
    title: 'Lagoon Project Key',
    key,
    can_push: false,
  });

module.exports = {
  getGroup,
  getGroupMembers,
  getAllGroups,
  getProject,
  getProjectMembers,
  getAllProjects,
  getUser,
  getAllUsers,
  getSshKey,
  getUserByUsername,
  addDeployKeyToProject,
};
