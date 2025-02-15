import axios from 'axios';
import { getConfigFromEnv } from '../util/config';
import { User, Key } from './types';

const API_HOST = getConfigFromEnv('GITLAB_API_HOST', 'http://gitlab');
const API_TOKEN = getConfigFromEnv('GITLAB_API_TOKEN', 'personal access token');

const options = {
  baseURL: `${API_HOST}/api/v4/`,
  timeout: 30000,
  headers: {
    'Private-Token': API_TOKEN
  }
};

const gitlabapi = axios.create(options);

export const secureGitlabSystemHooks = [
  'group_create',
  'group_rename',
  'group_destroy',
  'project_create',
  'project_transfer',
  'project_rename',
  'project_update',
  'project_destroy',
  'user_create',
  'user_rename',
  'user_destroy',
  'user_add_to_group',
  'user_remove_from_group',
  'user_add_to_team',
  'user_remove_from_team',
  'key_create',
  'key_destroy',
];

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

const getRequest = async (url: string): Promise<any> => {
  try {
    const response = await gitlabapi.get(url);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const errorMessage = error.response?.data?.message ?? error.message;
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
    } else {
      throw error;
    }
  }
};

const postRequest = async (url: string, body: any): Promise<any> => {
  try {
    const response = await gitlabapi.post(url, body);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const errorMessage = error.response?.data?.message ?? error.message;
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
    } else {
      throw error;
    }
  }
};

const getAllPagesRequest = async <Type>(url: string): Promise<Type[]> => {
  let page = 1;
  let moreResults = true;
  let results: any[] = [];

  do {
    try {
      const response = await gitlabapi.get(url, {
        params: {
          per_page: 100,
          page
        }
      });

      if (response.data.length === 0) {
        moreResults = false;
      } else {
        page++;
        results = [...results, ...response.data];
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const errorMessage = error.response?.data?.message ?? error.message;
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
      } else {
        throw error;
      }
    }
  } while (moreResults);

  return results;
};

export const getUserByUsername = async (username: string): Promise<User> => {
  try {
    const response = await gitlabapi.get('users', {
      params: {
        username
      }
    });

    if (response.data.length === 0) {
      throw new APIError(`No user found with username: ${username}`);
    }

    return response.data[0];
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const errorMessage = error.response?.data?.message ?? error.message;
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
    } else {
      throw error;
    }
  }
};

export const getAllGroups = async () => getAllPagesRequest('groups');
export const getGroup = async (groupId: number): Promise<any> =>
  getRequest(`groups/${groupId}`);
export const getGroupMembers = async (groupId: number): Promise<any> =>
  getRequest(`groups/${groupId}/members`);
export const getAllProjects = async (): Promise<any> =>
  getAllPagesRequest('projects');
export const getProject = async (projectId: number): Promise<any> =>
  getRequest(`projects/${projectId}`);
export const getProjectMembers = async (projectId: number): Promise<any> =>
  getRequest(`projects/${projectId}/members`);
export const getAllUsers = async () => getAllPagesRequest<User>('users');
export const getUser = async (userId: number): Promise<User> =>
  getRequest(`users/${userId}`);
export const getSshKey = async (keyId: number): Promise<Key> =>
  getRequest(`keys/${keyId}`);

export const addDeployKeyToProject = async (
  projectId: number,
  key: string
): Promise<any> =>
  postRequest(`projects/${projectId}/deploy_keys`, {
    title: 'Lagoon Project Key',
    key,
    can_push: false
  });
