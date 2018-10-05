// @flow

import type { Project, DeploymentPatch } from './types';

const { Lokka } = require('lokka');
const { Transport } = require('lokka-transport-http');
const R = require('ramda');
const { createJWTWithoutSshKey } = require('./jwt');
const { logger } = require('./local-logging');

const { JWTSECRET, JWTAUDIENCE } = process.env;
const API_HOST = R.propOr('http://api:3000', 'API_HOST', process.env);

if (JWTSECRET == null) {
  logger.warn(
    'No JWTSECRET env variable set... this will cause api requests to fail',
  );
}

if (JWTAUDIENCE == null) {
  logger.warn(
    'No JWTAUDIENCE env variable set... this *might* cause api requests to fail',
  );
}

const apiAdminToken = createJWTWithoutSshKey({
  payload: {
    role: 'admin',
    iss: 'lagoon-commons',
    aud: JWTAUDIENCE || 'api.amazee.io',
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

class EnvironmentNotFound extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentNotFound';
  }
}

class NoActiveSystemsDefined extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoActiveSystemsDefined';
  }
}

const capitalize = R.replace(/^\w/, R.toUpper);

async function getProjectsByGitUrl(gitUrl: string): Promise<Project[]> {
  const result = await graphqlapi.query(`
    {
      allProjects(gitUrl: "${gitUrl}") {
        name
        productionEnvironment
        openshift {
          consoleUrl
          token
          projectUser
          routerPattern
        }
      }
    }
  `);

  if (!result || !result.allProjects || !result.allProjects.length) {
    throw new ProjectNotFound(`Cannot find project for git repo ${gitUrl}`);
  }

  return result.allProjects;
}

async function getRocketChatInfoForProject(
  project: string,
): Promise<Array<Object>> {
  const notificationsFragment = graphqlapi.createFragment(`
    fragment on NotificationRocketChat {
      webhook
      channel
    }
  `);

  const result = await graphqlapi.query(`
    {
      project:projectByName(name: "${project}") {
        rocketchats: notifications(type: ROCKETCHAT) {
          ...${notificationsFragment}
        }
      }
    }
  `);

  if (!result || !result.project || !result.project.rocketchats) {
    throw new ProjectNotFound(
      `Cannot find rocketchat information for project ${project}`,
    );
  }

  return result.project.rocketchats;
}

async function getSlackinfoForProject(project: string): Promise<Project> {
  const notificationsFragment = graphqlapi.createFragment(`
    fragment on NotificationSlack {
      webhook
      channel
    }
  `);

  const result = await graphqlapi.query(`
    {
      project:projectByName(name: "${project}") {
        slacks: notifications(type: SLACK) {
          ...${notificationsFragment}
        }
      }
    }
  `);

  if (!result || !result.project || !result.project.slacks) {
    throw new ProjectNotFound(
      `Cannot find slack information for project ${project}`,
    );
  }

  return result.project.slacks;
}

async function getActiveSystemForProject(
  project: string,
  task: string,
): Promise<Object> {
  const field = `activeSystems${capitalize(task)}`;
  const result = await graphqlapi.query(`
    {
      project:projectByName(name: "${project}"){
        ${field}
        branches
        pullrequests
      }
    }
  `);

  if (!result || !result.project) {
    throw new ProjectNotFound(
      `Cannot find active-systems information for project ${project}`,
    );
  }

  if (!result.project[field]) {
    throw new NoActiveSystemsDefined(
      `Cannot find active system for task ${task} in project ${project}`,
    );
  }

  return result.project;
}

async function getEnvironmentByName(
  name: string,
  projectId: number
): Promise<Project[]> {
  const result = await graphqlapi.query(`
    {
      environmentByName(name: "${name}", project:${projectId}) {
        id,
        name,
        route,
        routes,
        deployType,
        environmentType,
        openshiftProjectName,
        updated,
        created,
        deleted,
      }
    }
  `);

  if (!result || !result.environmentByName) {
    throw new EnvironmentNotFound(`Cannot find environment for projectId ${projectId}, name ${name}\n${result.environmentByName}`);
  }

  return result;
}

const addOrUpdateEnvironment = (
  name: string,
  projectId: number,
  deployType: string,
  environmentType: string,
  openshiftProjectName: string,
): Promise<Object> =>
  graphqlapi.query(`
  mutation {
    addOrUpdateEnvironment(input: {
        name: "${name}",
        project: ${projectId},
        deployType: ${deployType},
        environmentType: ${environmentType},
        openshiftProjectName: "${openshiftProjectName}"
    }) {
      id
      name
      project {
        name
      }
      deployType
      environmentType
      openshiftProjectName
    }
  }
`);

const updateEnvironment = (
  environmentId: number,
  patch: string,
): Promise<Object> =>
  graphqlapi.query(`
    mutation {
      updateEnvironment(input: {
        id: ${environmentId},
        patch: ${patch}
      }) {
        id
        name
      }
    }
  `);

async function deleteEnvironment(
  name: string,
  project: string,
): Promise<Object> {
  const result = await graphqlapi.query(`
    {
      project:projectByName(name: "${project}"){
        id
      }
    }
  `);

  if (!result || !result.project) {
    throw new ProjectNotFound(`Cannot load id for project ${project}`);
  }

  return graphqlapi.query(`
    mutation {
      deleteEnvironment(input: {name: "${name}", project: ${result.project.id}})
    }
  `);
}

const getOpenShiftInfoForProject = (project: string): Promise<Object> =>
  graphqlapi.query(`
    {
      project:projectByName(name: "${project}"){
        id
        openshift  {
          consoleUrl
          token
          projectUser
          routerPattern
        }
        customer {
          privateKey
        }
        gitUrl
        subfolder
        openshiftProjectPattern
        productionEnvironment
      }
    }
`);

const getEnvironmentsForProject = (project: string): Promise<Object> =>
graphqlapi.query(`
  {
    project:projectByName(name: "${project}"){
      developmentEnvironmentsLimit
      productionEnvironment
      environments(includeDeleted:false) { name, environmentType }
    }
  }
`);

const getProductionEnvironmentForProject = (project: string): Promise<Object> =>
  graphqlapi.query(`
    {
      project:projectByName(name: "${project}"){
        productionEnvironment
      }
    }
`);

const deploymentFragment = graphqlapi.createFragment(`
fragment on Deployment {
  id
  name
  status
  created
  started
  completed
  remoteId
  environment {
    name
  }
}
`);

const getDeploymentByRemoteId = (id: string): Promise<Object> =>
  graphqlapi.query(
    `
  query deploymentByRemoteId($id: String!) {
    deploymentByRemoteId(id: $id) {
      ...${deploymentFragment}
    }
  }
`,
    { id },
  );

const addDeployment = (
  name: string,
  status: string,
  created: string,
  environment: number,
  remoteId: string = null,
  id: number = null,
  started: string = null,
  completed: string = null,
): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($name: String!, $status: DeploymentStatusType!, $created: String!, $environment: Int!, $id: Int, $remoteId: String, $started: String, $completed: String) {
    addDeployment(input: {
        name: $name
        status: $status
        created: $created
        environment: $environment
        id: $id
        remoteId: $remoteId
        started: $started
        completed: $completed
    }) {
      ...${deploymentFragment}
    }
  }
`,
    {
      name,
      status,
      created,
      environment,
      id,
      remoteId,
      started,
      completed,
    },
  );

const updateDeployment = (
  id: number,
  patch: DeploymentPatch,
): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($id: Int!, $patch: UpdateDeploymentPatchInput!) {
    updateDeployment(input: {
      id: $id
      patch: $patch
    }) {
      ...${deploymentFragment}
    }
  }
`,
    { id, patch },
  );

module.exports = {
  getProjectsByGitUrl,
  getRocketChatInfoForProject,
  getSlackinfoForProject,
  getActiveSystemForProject,
  getOpenShiftInfoForProject,
  getEnvironmentByName,
  getProductionEnvironmentForProject,
  getEnvironmentsForProject,
  addOrUpdateEnvironment,
  updateEnvironment,
  deleteEnvironment,
  getDeploymentByRemoteId,
  addDeployment,
  updateDeployment,
};
