// @flow

import type {
  Project,
  GroupPatch,
  UserPatch,
  ProjectPatch,
  DeploymentPatch,
  TaskPatch,
  RestorePatch,
} from './types';

const { Lokka } = require('lokka');
const { Transport } = require('@lagoon/lokka-transport-http');
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
  timeout: 60000,
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

const groupFragment = graphqlapi.createFragment(`
fragment on Group {
  id
  name
}
`);


const projectFragment = graphqlapi.createFragment(`
fragment on Project {
  id
  name
  gitUrl
  privateKey
}
`);

const backupFragment = graphqlapi.createFragment(`
fragment on Backup {
  id
  environment {
    id
  }
  backupId
  source
  created
}
`);

const addGroup = (
  name: string,
): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($name: String!) {
    addGroup(input: {
        name: $name
    }) {
      ...${groupFragment}
    }
  }
`,
    {
      name,
    },
  );

const addGroupWithParent = (
  name: string,
  parentGroupName: string,
): Promise<Object> =>
  graphqlapi.mutate(
    `
    ($name: String!, $parentGroupName: String) {
      addGroup(input: {
          name: $name
          parentGroup: { name: $parentGroupName }
      }) {
        ...${groupFragment}
      }
    }
  `,
    {
      name,
      parentGroupName,
    },
  );

const addBackup = (
  id: ?number = null,
  environment: number,
  source: string,
  backupId: string,
  created: string,
): Promise<Object> =>
  graphqlapi.mutate(
    `
    ($id: Int, $environment: Int!, $source: String!, $backupId: String!, $created: String!) {
      addBackup(input: {
          id: $id
          environment: $environment
          source: $source
          backupId: $backupId
          created: $created
      }) {
        ...${backupFragment}
      }
    }
  `,
    {
      id,
      environment,
      source,
      backupId,
      created,
    },
  );

const deleteBackup = (backupId: string): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($backupId: String!) {
    deleteBackup(input: {
      backupId: $backupId
    })
  }
  `,
    { backupId },
  );

const restoreFragment = graphqlapi.createFragment(`
  fragment on Restore {
    id
    status
    created
    restoreLocation
    backupId
  }
  `);

const updateRestore = (
  backupId: string,
  patch: RestorePatch,
): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($backupId: String!, $patch: UpdateRestorePatchInput!) {
    updateRestore(input: {
      backupId: $backupId
      patch: $patch
    }) {
      ...${restoreFragment}
    }
  }
`,
    { backupId, patch },
  );

const getAllEnvironmentBackups = (): Promise<Project[]> =>
  graphqlapi.query(
    `
  {
    allEnvironments {
      id
      name
      openshiftProjectName
      project {
        name
      }
      backups {
        ...${backupFragment}
      }
    }
  }
`,
  );

const updateGroup = (name: string, patch: GroupPatch): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($name: String!, $patch: UpdateGroupPatchInput!) {
    updateGroup(input: {
      group: {
        name: $name
      }
      patch: $patch
    }) {
      ...${groupFragment}
    }
  }
  `,
    { name, patch },
  );

const deleteGroup = (name: string): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($name: String!) {
    deleteGroup(input: {
      group: {
        name: $name
      }
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
  email: string,
  firstName: string,
  lastName: ?string = null,
  comment: ?string = null,
  gitlabId: ?number = null,
): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($email: String!, $firstName: String, $lastName: String, $comment: String, $gitlabId: Int) {
    addUser(input: {
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
      email,
      firstName,
      lastName,
      comment,
      gitlabId,
    },
  );

const updateUser = (email: string, patch: UserPatch): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($email: String!, $patch: UpdateUserPatchInput!) {
    updateUser(input: {
      user: {
        email: $email
      }
      patch: $patch
    }) {
      ...${userFragment}
    }
  }
  `,
    { email, patch },
  );

const deleteUser = (email: string): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($email: Int!) {
    deleteUser(input: {
      user: {
        email: $email
      }
    })
  }
  `,
    { email },
  );

const addUserToGroup = (userEmail: string, groupName: string, role: string): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($userEmail: String!, $groupName: String!, $role: GroupRole!) {
    addUserToGroup(input: {
      user: { email: $userEmail }
      group: { name: $groupName }
      role: $role
    }) {
      ...${groupFragment}
    }
  }
  `,
    { userEmail, groupName, role },
  );

const addGroupToProject = (project: string, group: string): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($project: String!, $group: String!) {
    addGroupsToProject(input: {
      project: { name: $project}
      groups: [{name: $group}]
    }) {
      ...${projectFragment}
    }
  }
  `,
    { project, group },
  );

const removeGroupFromProject = (project: string, group: string): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($project: String!, $group: String!) {
    removeGroupsFromProject(input: {
      project: { name: $project}
      groups: [{name: $group}]
    }) {
      ...${projectFragment}
    }
  }
  `,
    { project, group },
  );

const removeUserFromGroup = (
  userEmail: string, groupName: string,
): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($userEmail: String!, $groupName: String!) {
    removeUserFromGroup(input: {
      user: { email: $userEmail }
      group: { name: $groupName }
    }) {
      ...${groupFragment}
    }
  }
  `,
    { userEmail, groupName },
  );

const addSshKey = (
  id: ?number = null,
  name: string,
  keyValue: string,
  keyType: string,
  userEmail: string,
): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($id: Int, $name: String!, $keyValue: String!, $keyType: SshKeyType!, $userEmail: String!) {
    addSshKey(input: {
      id: $id
      name: $name
      keyValue: $keyValue
      keyType: $keyType
      user: {
        email: $userEmail
      }
    }) {
      ...${sshKeyFragment}
    }
  }
  `,
    {
      id,
      name,
      keyValue,
      userEmail,
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
  gitUrl: string,
  openshift: number,
  productionenvironment: string,
  id: ?number = null,
): Promise<Object> =>
  graphqlapi.mutate(
    `
    ($name: String!, $gitUrl: String!, $openshift: Int!, $productionenvironment: String!, $id: Int) {
      addProject(input: {
        name: $name,
        gitUrl: $gitUrl,
        openshift: $openshift,
        productionEnvironment: $productionenvironment,
        id: $id,
      }) {
        ...${projectFragment}
      }
    }
  `,
    {
      name,
      gitUrl,
      openshift,
      productionenvironment,
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

async function getProjectByName(
  project: string,
): Promise<Object> {
  const result = await graphqlapi.query(`
    {
      project:projectByName(name: "${project}") {
        ...${projectFragment}
      }
    }
  `);

  if (!result || !result.project) {
    throw new ProjectNotFound(
      `Cannot find project ${project}`,
    );
  }

  return result.project;
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

async function getEnvironmentByOpenshiftProjectName(
  openshiftProjectName: string,
): Promise<Project[]> {
  const result = await graphqlapi.query(`
    {
      environmentByOpenshiftProjectName(openshiftProjectName: "${openshiftProjectName}") {
        id,
        name,
        project {
          name
        }
      }
    }
  `);

  if (!result || !result.environmentByOpenshiftProjectName) {
    throw new EnvironmentNotFound(
      `Cannot find environment for OpenshiftProjectName ${openshiftProjectName}\n${
        result.environmentByOpenshiftProjectName
      }`,
    );
  }

  return result;
}

const addOrUpdateEnvironment = (
  name: string,
  projectId: number,
  deployType: string,
  deployBaseRef: string,
  environmentType: string,
  openshiftProjectName: string,
  deployHeadRef: ?string = null,
  deployTitle: ?string = null,
): Promise<Object> =>
  graphqlapi.mutate(
    `
($name: String!, $project: Int!, $deployType: DeployType!, $deployBaseRef: String!, $deployHeadRef: String, $deployTitle: String, $environmentType: EnvType!, $openshiftProjectName: String!) {
  addOrUpdateEnvironment(input: {
    name: $name,
    project: $project,
    deployType: $deployType,
    deployBaseRef: $deployBaseRef,
    deployHeadRef: $deployHeadRef,
    deployTitle: $deployTitle,
    environmentType: $environmentType,
    openshiftProjectName: $openshiftProjectName
  }) {
    id
    name
    project {
      name
    }
    deployType
    environmentType
    openshiftProjectName
    envVariables {
      name
      value
      scope
    }
  }
}
`,
    {
      name,
      project: projectId,
      deployType,
      deployBaseRef,
      deployHeadRef,
      deployTitle,
      environmentType,
      openshiftProjectName,
    },
  );

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
  execute: boolean = true,
): Promise<Object> {
  return graphqlapi.mutate(
    `
  ($name: String!, $project: String!, $execute: Boolean) {
    deleteEnvironment(input: {
      name: $name
      project: $project
      execute: $execute
    })
  }
  `,
    {
      name,
      project,
      execute,
    },
  );
}

const getOpenShiftInfoForProject = (project: string): Promise<Object> =>
  graphqlapi.query(`
    {
      project:projectByName(name: "${project}"){
        id
        openshift  {
          name
          consoleUrl
          token
          projectUser
          routerPattern
        }
        gitUrl
        privateKey
        subfolder
        openshiftProjectPattern
        productionEnvironment
        envVariables {
          name
          value
          scope
        }
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

const setEnvironmentServices = (
  environment: number,
  services: array,
): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($environment: Int!, $services: [String]!) {
    setEnvironmentServices(input: {
      environment: $environment
      services: $services
    }) {
      id
      name
    }
  }
  `,
    { environment, services },
  );

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
  remoteId: ?string = null,
  id: ?number = null,
  started: ?string = null,
  completed: ?string = null,
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

const taskFragment = graphqlapi.createFragment(`
fragment on Task {
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

const updateTask = (id: number, patch: TaskPatch): Promise<Object> =>
  graphqlapi.mutate(
    `
  ($id: Int!, $patch: UpdateTaskPatchInput!) {
    updateTask(input: {
      id: $id
      patch: $patch
    }) {
      ...${taskFragment}
    }
  }
`,
    { id, patch },
  );

const sanitizeGroupName = R.replace(/[^\w\d-_]/g, '-');

module.exports = {
  addGroup,
  addGroupWithParent,
  updateGroup,
  deleteGroup,
  getUserBySshKey,
  addUser,
  addBackup,
  deleteBackup,
  updateRestore,
  getAllEnvironmentBackups,
  updateUser,
  deleteUser,
  addUserToGroup,
  removeUserFromGroup,
  addSshKey,
  deleteSshKey,
  addProject,
  updateProject,
  deleteProject,
  getProjectsByGitUrl,
  getProjectByName,
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
  setEnvironmentServices,
  getDeploymentByRemoteId,
  addDeployment,
  updateDeployment,
  getEnvironmentByOpenshiftProjectName,
  updateTask,
  addGroupToProject,
  removeGroupFromProject,
  sanitizeGroupName,
};
