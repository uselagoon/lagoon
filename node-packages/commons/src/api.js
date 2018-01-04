// @flow

import type { Project } from './types';

const { Lokka } = require('lokka');
const { Transport } = require('lokka-transport-http');
const { createJWTWithoutSshKey } = require('./jwt');
const { logger } = require('./local-logging');

const {
  API_HOST = 'http://api:3000',
  JWTSECRET,
  JWTAUDIENCE,
} = process.env;

if (JWTSECRET == null) {
  logger.warn(
    'No JWTSECRET env variable set... this will cause api requests to fail'
  );
}

if (JWTAUDIENCE == null) {
  logger.warn(
    'No JWTAUDIENCE env variable set... this *might* cause api requests to fail'
  );
}

const apiAdminToken = createJWTWithoutSshKey({
  payload: {
    role: 'admin',
    iss: 'lagoon-commons',
    aud: JWTAUDIENCE || 'api.amazee.io'
  },
  jwtSecret: JWTSECRET || '',
});

const options = {
  headers: {
    Authorization: `Bearer ${apiAdminToken}`,
  },
};

const transport = new Transport(`${API_HOST}/graphql`, options);

const graphqlapi = new Lokka({ transport });

class ProjectNotFound extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectNotFound';
  }
}

class NoActiveSystemsDefined extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoActiveSystemsDefined';
  }
}

async function getProjectsByGitUrl(gitUrl: string): Project[] {
  const result = await graphqlapi.query(`
    {
      allProjects(gitUrl: "${gitUrl}") {
        name
        production_environment
        openshift {
          console_url
          token
          project_user
          router_pattern
        }
      }
    }
  `);

  if (!result || !result.allProjects || !result.allProjects.length) {
    throw new ProjectNotFound(
      `Cannot find project for git repo ${gitUrl}`
    );
  }

  return result.allProjects;
}



async function getSlackinfoForProject(project: string): Project {

  const notificationsFragment = graphqlapi.createFragment(`
    fragment on NotificationSlack {
      webhook
      channel
    }
  `);

  const result = await graphqlapi.query(`
    {
      project:projectByName(name: "${project}") {
        slacks: notifications(type: "slack") {
          ...${notificationsFragment}
        }
      }
    }
  `);

  if (!result || !result.project || !result.project.slacks) {
    throw new ProjectNotFound(
      `Cannot find slack information for project ${project}`
    );
  }

  return result.project.slacks;
}

async function getActiveSystemForProject(
  project: string,
  task: string
): Promise<String> {
  const result = await graphqlapi.query(`
    {
      project:projectByName(name: "${project}"){
        active_systems_${task}
        branches
        pullrequests
      }
    }
  `);

  if (!result || !result.project) {
    throw new ProjectNotFound(
      `Cannot find active-systems information for project ${project}`
    );
  }

  if (!result.project[`active_systems_${task}`]) {
    throw new NoActiveSystemsDefined(
      `Cannot find active system for task ${task} in project ${project}`
    );
  }

  return result.project;
}

const addOrUpdateEnvironment = (name: string, projectId: number, git_type: string, environment_type: string, openshift_projectname: string ): Promise<Object> => graphqlapi.query(`
  mutation {
    addOrUpdateEnvironment(input: {
        name: "${name}",
        project: ${projectId},
        git_type: ${git_type},
        environment_type: ${environment_type},
        openshift_projectname: "${openshift_projectname}"
    }) {
      id
      name
      project {
        name
      }
      git_type
      environment_type
      openshift_projectname
    }
  }
`);

const deleteEnvironment = (name: string, project: string): Promise<Object> => graphqlapi.query(`
  mutation {
    deleteEnvironment(input: {name: "${name}", project: "${project}"})
  }
`);

const getOpenShiftInfoForProject = (project: string): Promise<Object> =>
  graphqlapi.query(`
    {
      project:projectByName(name: "${project}"){
        id
        openshift  {
          console_url
          token
          project_user
          router_pattern
        }
        customer {
          private_key
        }
        git_url
        production_environment
      }
    }
`);

const getProductionEnvironmentForProject = (project: string): Promise<Object> =>
  graphqlapi.query(`
    {
      project:projectByName(name: "${project}"){
        production_environment
      }
    }
`);

module.exports = {
  getProjectsByGitUrl,
  getSlackinfoForProject,
  getActiveSystemForProject,
  getOpenShiftInfoForProject,
  getProductionEnvironmentForProject,
  addOrUpdateEnvironment,
  deleteEnvironment,
};
