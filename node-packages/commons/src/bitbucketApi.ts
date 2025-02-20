import axios from 'axios';
import { getConfigFromEnv } from './util/config';

interface ApiResourceLink {
  href: string;
  name: string;
}

// https://docs.atlassian.com/bitbucket-server/rest/5.16.0/bitbucket-rest.html#idm8296923984
interface ApiProject {
  key: string;
  id: number;
  name: string;
  description: string;
  public: boolean
  links: {
    [key: string]: ApiResourceLink[]
  };
}

// https://docs.atlassian.com/bitbucket-server/rest/5.16.0/bitbucket-rest.html#idm8296923984
interface ApiRepo {
  slug: string;
  id: number;
  name: string;
  project: ApiProject;
  links: {
    [key: string]: ApiResourceLink[]
  };
}

// https://docs.atlassian.com/bitbucket-server/rest/5.16.0/bitbucket-rest.html#idm8297382224
interface ApiUser {
  name: string;
  emailAddress: string;
  id: number;
  displayName: string;
  active: boolean;
  slug: string;
  type: string;
}

// https://docs.atlassian.com/bitbucket-server/rest/5.16.0/bitbucket-rest.html#idm8297382224
enum ApiPermssion {
  REPO_ADMIN = 'REPO_ADMIN',
  REPO_READ = 'REPO_READ',
  REPO_WRITE = 'REPO_WRITE',
}

// https://docs.atlassian.com/bitbucket-server/rest/5.16.0/bitbucket-rest.html#idm8297382224
export interface ApiUserPermission {
  user: ApiUser;
  permission: ApiPermssion;
}

const API_HOST = getConfigFromEnv('BITBUCKET_API_HOST', 'https://bitbucket.org');
const API_TOKEN = getConfigFromEnv('BITBUCKET_API_TOKEN', 'personal access token');

const options = {
  baseURL: `${API_HOST}/rest/api/1.0/`,
  timeout: 30000,
  headers: {
    Authorization: `Bearer ${API_TOKEN}`
  }
};

const bitbucketapi = axios.create(options);

class NetworkError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

class APIError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'BitbucketAPIError';
  }
}

const getAllPagesRequest = async <T>(url: string): Promise<T[]> => {
  let start = 0;
  let moreResults = true;
  let results: T[] = [];

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

      results = [...results, ...response.data.values as T[]];
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const errorMessage = error.response?.data?.errors ?? error.message;
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

export const searchReposByName = async (name: string): Promise<ApiRepo | undefined> => {
  try {
    const repos = await getAllPagesRequest<ApiRepo>(
      `repos?name=${name}&permission=REPO_READ`
    );

    return repos.find(repo => repo.slug === name);
  } catch (e) {
    throw e;
  }
};

export const getRepoUsers = async (project: string, repo: string): Promise<ApiUserPermission[]> =>
  getAllPagesRequest<ApiUserPermission>(`projects/${project}/repos/${repo}/permissions/users`);
