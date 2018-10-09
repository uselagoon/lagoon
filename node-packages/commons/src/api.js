// @flow

import type { Project, CustomerPatch, UserPatch, ProjectPatch, DeploymentPatch } from './types';

const { Lokka } = require('lokka');
const { Transport } = require('lokka-transport-http');
const R = require('ramda');
const { createJWTWithoutUserId } = require('./jwt');
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
    'No JWTAUDIENCE env variable set... this may cause api requests to fail',
  );
}

const apiAdminToken = createJWTWithoutUserId({
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

const sshKeyFragment = graphqlapi.createFragment(`
fragment on SshKey {
  id
  name
  keyValue
  keyType
}
`);

const userFragment = graphqlapi.createFragment(`
fragment on User {
  id
  email
  firstName
  lastName
  gitlabId
  sshKeys {
    id
    name
  }
}
`);

const customerFragment = graphqlapi.createFragment(`
fragment on Customer {
  id
  name
  comment
  privateKey
  created
  users {
    ...${userFragment}
  }
}
`);

const projectFragment = graphqlapi.createFragment(`
fragment on Project {
  id
  name
  gitUrl
  users {
    ...${userFragment}
  }
}
`);

const addCustomer = (
  name: string,
  id: ?number = null,
  comment: ?string = null,
  privateKey: ?string = null,
): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($name: String!, $id: Int, $comment: String, $privateKey: String) {
    addCustomer(input: {
        name: $name
        id: $id
        comment: $comment
        privateKey: $privateKey
    }) {
      ...${customerFragment}
    }
  }
`,
    {
      name,
      id,
      comment,
      privateKey,
    },
  );

const updateCustomer = (id: number, patch: CustomerPatch): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($id: Int!, $patch: UpdateCustomerPatchInput!) {
    updateCustomer(input: {
      id: $id
      patch: $patch
    }) {
      ...${customerFragment}
    }
  }
  `,
    { id, patch },
  );

const deleteCustomer = (name: string): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($name: String!) {
    deleteCustomer(input: {
      name: $name
    })
  }
  `,
    { name },
  );

const getUserBySshKey = (sshKey: string): Promise<Object> =>
  graphqlapi.query(
    `
  query userBySshKey($sshKey: String!) {
    userBySshKey(sshKey: $sshKey) {
      ...${userFragment}
    }
  }
`,
    { sshKey },
  );

const addUser = (
  id: number,
  email: string,
  firstName: string,
  lastName: ?string = null,
  comment: ?string = null,
  gitlabId: ?number = null,
): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($id: Int, $email: String!, $firstName: String, $lastName: String, $comment: String, $gitlabId: Int) {
    addUser(input: {
      id: $id
      email: $email
      firstName: $firstName
      lastName: $lastName
      comment: $comment
      gitlabId: $gitlabId
    }) {
      ...${userFragment}
    }
  }
`,
    {
      id,
      email,
      firstName,
      lastName,
      comment,
      gitlabId,
    },
  );

const updateUser = (id: number, patch: UserPatch): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($id: Int!, $patch: UpdateUserPatchInput!) {
    updateUser(input: {
      id: $id
      patch: $patch
    }) {
      ...${userFragment}
    }
  }
  `,
    { id, patch },
  );

const deleteUser = (id: number): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($id: Int!) {
    deleteUser(input: {
      id: $id
    })
  }
  `,
    { id },
  );

const addUserToCustomer = (userId: number, customer: string): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($userId: Int!, $customer: String!) {
    addUserToCustomer(input: {
      userId: $userId
      customer: $customer
    }) {
      ...${customerFragment}
    }
  }
  `,
    { userId, customer },
  );

const removeUserFromCustomer = (
  userId: number,
  customer: string,
): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($userId: Int!, $customer: String!) {
    removeUserFromCustomer(input: {
      userId: $userId
      customer: $customer
    }) {
      ...${customerFragment}
    }
  }
  `,
    { userId, customer },
  );

const addUserToProject = (userId: number, project: string): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($userId: Int!, $project: String!) {
    addUserToProject(input: {
      userId: $userId
      project: $project
    }) {
      ...${projectFragment}
    }
  }
  `,
    { userId, project },
  );

const removeUserFromProject = (
  userId: number,
  project: string,
): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($userId: Int!, $project: String!) {
    removeUserFromProject(input: {
      userId: $userId
      project: $project
    }) {
      ...${projectFragment}
    }
  }
  `,
    { userId, project },
  );

const addSshKey = (
  id: number,
  name: string,
  keyValue: string,
  keyType: string,
  userId: number,
): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($id: Int!, $name: String!, $keyValue: String!, $keyType: SshKeyType!, $userId: Int!) {
    addSshKey(input: {
      id: $id
      name: $name
      keyValue: $keyValue
      keyType: $keyType
      userId: $userId
    }) {
      ...${sshKeyFragment}
    }
  }
  `,
    {
      id,
      name,
      keyValue,
      userId,
      keyType,
    },
  );

const deleteSshKey = (name: string): Promise<Object> =>
  graphqlapi.mutate(
    `
    ($name: String!) {
      deleteSshKey(input: {
        name: $name
      })
    }
    `,
    {
      name,
    },
  );

const addProject = (
  name: string,
  customer: number,
  gitUrl: string,
  openshift: number,
  id: ?number = null,
): Promise<Object> =>
  graphqlapi.mutate(
    `
    ($name: String!, $customer: Int!, $gitUrl: String!, $openshift: Int!, $id: Int) {
      addProject(input: {
        name: $name,
        customer: $customer,
        gitUrl: $gitUrl,
        openshift: $openshift,
        id: $id,
      }) {
        ...${projectFragment}
      }
    }
  `,
    {
      name,
      customer,
      gitUrl,
      openshift,
      id,
    },
  );

const updateProject = (id: number, patch: ProjectPatch): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($id: Int!, $patch: UpdateProjectPatchInput!) {
    updateProject(input: {
      id: $id
      patch: $patch
    }) {
      ...${projectFragment}
    }
  }
  `,
    { id, patch },
  );

const deleteProject = (name: string): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($name: String!) {
    deleteProject(input: {
      project: $name
    })
  }
  `,
    { name },
  );

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
  projectId: number,
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
    throw new EnvironmentNotFound(
      `Cannot find environment for projectId ${projectId}, name ${name}\n${
        result.environmentByName
      }`,
    );
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
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getUserBySshKey,
  addUser,
  updateUser,
  deleteUser,
  addUserToCustomer,
  removeUserFromCustomer,
  addUserToProject,
  removeUserFromProject,
  addSshKey,
  deleteSshKey,
  addProject,
  updateProject,
  deleteProject,
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
