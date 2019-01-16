// @flow

const gql = require('./util/gql');

// TODO: Split up this file

// TODO: Re-enable Prettier after the problem with escaping interpolation in
// embedded GraphQL in JS is fixed and new version released.
// Ref: https://github.com/prettier/prettier/issues/4974
// prettier-ignore
const typeDefs = gql`
  scalar Date

  enum SshKeyType {
    SSH_RSA
    SSH_ED25519
  }

  enum DeployType {
    BRANCH
    PULLREQUEST
    PROMOTE
  }

  enum EnvType {
    PRODUCTION
    DEVELOPMENT
  }

  enum NotificationType {
    SLACK
    ROCKETCHAT
  }

  enum DeploymentStatusType {
    NEW
    PENDING
    RUNNING
    CANCELLED
    ERROR
    FAILED
    COMPLETE
  }

  enum EnvVariableType {
    PROJECT
    ENVIRONMENT
  }

  enum EnvVariableScope {
    BUILD
    RUNTIME
    GLOBAL
  }

  enum TaskStatusType {
    ACTIVE
    SUCCEEDED
    FAILED
  }

  enum RestoreStatusType {
    PENDING
    SUCCESSFUL
    FAILED
  }

  type File {
    id: Int
    filename: String
    download: String
    created: String
  }

  type SshKey {
    id: Int
    name: String
    keyValue: String
    keyType: String
    created: String
  }

  type User {
    id: Int
    email: String
    firstName: String
    lastName: String
    comment: String
    gitlabId: Int
    sshKeys: [SshKey]
  }

  """
  Lagoon Customer (used for grouping multiple Projects)
  """
  type Customer {
    """
    Internal ID of this customer
    """
    id: Int
    """
    Name of customer
    """
    name: String
    """
    Arbitrary String for some comment
    """
    comment: String
    """
    SSH Private Key of Customer
    Will be used to authenticate against the Git Repos of the Project that are assigned to this project
    Needs to be in single string separated by \`\n\`, example:
    \`\`\`
    -----BEGIN RSA PRIVATE KEY-----\nMIIJKQIBAAKCAgEA+o[...]P0yoL8BoQQG2jCvYfWh6vyglQdrDYx/o6/8ecTwXokKKh6fg1q\n-----END RSA PRIVATE KEY-----
    \`\`\`
    """
    privateKey: String
    users: [User]
    created: String
    projects: [Project]
  }

  type Openshift {
    id: Int
    name: String
    consoleUrl: String
    token: String
    routerPattern: String
    projectUser: String
    sshHost: String
    sshPort: String
    created: String
  }

  type NotificationRocketChat {
    id: Int
    name: String
    webhook: String
    channel: String
  }

  type NotificationSlack {
    id: Int
    name: String
    webhook: String
    channel: String
  }

  type UnassignedNotification {
    id: Int
    name: String
    type: String
  }

  union Notification = NotificationRocketChat | NotificationSlack

  """
  Lagoon Project (like a git repository)
  """
  type Project {
    """
    ID of project
    """
    id: Int
    """
    Name of project
    """
    name: String
    """
    Reference to customer object
    """
    customer: Customer
    """
    Git URL, needs to be SSH Git URL in one of these two formats
    - git@192.168.99.1/project1.git
    - ssh://git@192.168.99.1:2222/project1.git
    """
    gitUrl: String
    """
    Set if the .lagoon.yml should be found in a subfolder
    Usefull if you have multiple Lagoon projects per Git Repository
    """
    subfolder: String
    """
    Notifications that should be sent for this project
    """
    notifications(type: NotificationType): [Notification]
    """
    Which internal Lagoon System is responsible for deploying
    Currently only 'lagoon_openshiftBuildDeploy' exists
    """
    activeSystemsDeploy: String
    """
    Which internal Lagoon System is responsible for promoting
    Currently only 'lagoon_openshiftBuildDeploy' exists
    """
    activeSystemsPromote: String
    """
    Which internal Lagoon System is responsible for promoting
    Currently only 'lagoon_openshiftRemove' exists
    """
    activeSystemsRemove: String
    """
    Which internal Lagoon System is responsible for tasks
    Currently only 'lagoon_openshiftJob' exists
    """
    activeSystemsTask: String
    """
    Which branches should be deployed, can be one of:
    - \`true\` - all branches are deployed
    - \`false\` - no branches are deployed
    - REGEX - regex of all branches that should be deployed, example: \`^(master|staging)$\`
    """
    branches: String
    """
    Which Pull Requests should be deployed, can be one of:
    - \`true\` - all pull requests are deployed
    - \`false\` - no pull requests are deployed
    - REGEX - regex of all Pull Request titles that should be deployed, example: \`[BUILD]\`
    """
    pullrequests: String
    """
    Which environment(the name) should be marked as the production environment.
    *Important:* If you change this, you need to deploy both environments (the current and previous one) that are affected in order for the change to propagate correctly
    """
    productionEnvironment: String
    """
    Should this project have auto idling enabled (\`1\` or \`0\`)
    """
    autoIdle: Int
    """
    Should storage for this environment be calculated (\`1\` or \`0\`)
    """
    storageCalc: Int
    """
    Reference to OpenShift Object this Project should be deployed to
    """
    openshift: Openshift
    """
    Pattern of OpenShift Project/Namespace that should be generated, default: \`$\{project}-$\{environmentname}\`
    """
    openshiftProjectPattern: String
    """
    Which Developer SSH keys should have access to this project
    """
    users: [User]
    """
    How many environments can be deployed at one timeout
    """
    developmentEnvironmentsLimit: Int
    """
    Deployed Environments for this Project
    """
    environments(
      """
      Filter by Environment Type
      """
      type: EnvType
      """
      Include deleted Environments (by default deleted environment are hidden)
      """
      includeDeleted: Boolean
    ): [Environment]
    """
    Creation Timestamp of Project
    """
    created: String
    """
    Environment variables available during build-time and run-time
    """
    envVariables: [EnvKeyValue]
  }

  """
  Lagoon Environment (for each branch, pullrequest there is an individual environment)
  """
  type Environment {
    """
    Internal ID of this Environment
    """
    id: Int
    """
    Name of this Environment
    """
    name: String
    """
    Reference to the Project Object
    """
    project: Project
    """
    Which Deployment Type this environment is, can be \`branch\`, \`pullrequest\`, \`promote\`
    """
    deployType: String
    """
    Which Environment Type this environment is, can be \`production\`, \`development\`
    """
    environmentType: String
    """
    Name of the OpenShift Project/Namespace this environemnt is deployed into
    """
    openshiftProjectName: String
    """
    Unix Timestamp of the last time this environment has been updated
    """
    updated: String
    """
    Unix Timestamp if the creation time
    """
    created: String
    """
    Unix Timestamp of when this project has been deleted
    """
    deleted: String
    """
    Reference to EnvironmentHoursMonth API Object, which returns how many hours this environment ran in a specific month
    """
    hoursMonth(month: Date): EnvironmentHoursMonth
    """
    Reference to EnvironmentStorage API Object, which shows the Storage consumption of this environment per day
    """
    storages: [EnvironmentStorage]
    """
    Reference to EnvironmentStorageMonth API Object, which returns how many storage per day this environment used in a specific month
    """
    storageMonth(month: Date): EnvironmentStorageMonth
    """
    Reference to EnviornmentHitsMonth API Object, which returns how many hits this environment generated in a specific month
    """
    hitsMonth(month: Date): EnviornmentHitsMonth
    """
    Environment variables available during build-time and run-time
    """
    envVariables: [EnvKeyValue]
    route: String
    routes: String
    monitoringUrls: String
    deployments(name: String): [Deployment]
    backups(includeDeleted: Boolean): [Backup]
    tasks: [Task]
    services: [EnvironmentService]
  }

  type EnviornmentHitsMonth {
    total: Int
  }

  type EnvironmentStorage {
    id: Int
    environment: Environment
    persistentStorageClaim: String
    bytesUsed: Float
    updated: String
  }

  type EnvironmentStorageMonth {
    month: String
    bytesUsed: Float
  }

  type EnvironmentHoursMonth {
    month: String
    hours: Int
  }

  type EnvironmentService {
    id: Int
    name: String
  }

  type Backup {
    id: Int
    environment: Environment
    source: String
    backupId: String
    created: String
    deleted: String
    restore: Restore
  }

  type Restore {
    id: Int
    backupId: String
    status: String
    restoreLocation: String
    created: String
  }

  type Deployment {
    id: Int
    name: String
    status: String
    created: String
    started: String
    completed: String
    environment: Environment
    remoteId: String
    buildLog: String
  }

  type EnvKeyValue {
    id: Int
    scope: String
    name: String
    value: String
  }

  type Task {
    id: Int
    name: String
    status: String
    created: String
    started: String
    completed: String
    environment: Environment
    service: String
    command: String
    remoteId: String
    logs: String
    files: [File]
  }

  input DeleteEnvironmentInput {
    name: String!
    project: String!
    execute: Boolean
  }

  type Query {
    """
    Returns User Object by a given sshKey
    """
    userBySshKey(sshKey: String!): User
    """
    Returns Customer Object by a given name
    """
    customerByName(name: String!): Customer
    """
    Returns Project Object by a given name
    """
    projectByName(name: String!): Project
    """
    Returns Project Object by a given gitUrl (only the first one if there are multiple)
    """
    projectByGitUrl(gitUrl: String!): Project
    environmentByName(name: String!, project: Int!): Environment
    """
    Returns Environment Object by a given openshiftProjectName
    """
    environmentByOpenshiftProjectName(
      openshiftProjectName: String!
    ): Environment
    deploymentByRemoteId(id: String): Deployment
    taskByRemoteId(id: String): Task
    """
    Returns all Project Objects matching given filters (all if no filter defined)
    """
    allProjects(createdAfter: String, gitUrl: String): [Project]
    """
    Returns all Customer Objects matching given filter (all if no filter defined)
    """
    allCustomers(createdAfter: String): [Customer]
    """
    Returns all OpenShift Objects
    """
    allOpenshifts: [Openshift]
    """
    Returns all Environments matching given filter (all if no filter defined)
    """
    allEnvironments(createdAfter: String, type: EnvType): [Environment]
  }

  input AddSshKeyInput {
    id: Int
    name: String!
    keyValue: String!
    keyType: SshKeyType!
    userId: Int!
  }

  input DeleteSshKeyInput {
    name: String!
  }

  input AddProjectInput {
    id: Int
    name: String!
    customer: Int!
    gitUrl: String!
    subfolder: String
    openshift: Int!
    openshiftProjectPattern: String
    activeSystemsDeploy: String
    activeSystemsPromote: String
    activeSystemsRemove: String
    activeSystemsTask: String
    branches: String
    pullrequests: String
    productionEnvironment: String
    autoIdle: Int
    storageCalc: Int
    developmentEnvironmentsLimit: Int

  }

  input AddEnvironmentInput {
    id: Int
    name: String!
    project: Int!
    deployType: DeployType!
    environmentType: EnvType!
    openshiftProjectName: String!
  }

  input AddOrUpdateEnvironmentStorageInput {
    environment: Int!
    persistentStorageClaim: String!
    bytesUsed: Int!
  }

  input AddBackupInput {
    id: Int
    environment: Int!
    source: String!
    backupId: String!
    created: String!
  }

  input DeleteBackupInput {
    backupId: String!
  }

  input AddRestoreInput {
    id: Int
    status: RestoreStatusType
    restoreLocation: String
    created: String
    execute: Boolean
    backupId: String!
  }

  input UpdateRestoreInput {
    backupId: String!
    patch: UpdateRestorePatchInput!
  }

  input UpdateRestorePatchInput {
    status: RestoreStatusType
    created: String
    restoreLocation: String
  }

  input AddCustomerInput {
    id: Int
    name: String!
    comment: String
    privateKey: String
  }

  input DeploymentInput {
    id: Int
    name: String!
    status: DeploymentStatusType!
    created: String!
    started: String
    completed: String
    environment: Int!
    remoteId: String
  }

  input DeleteDeploymentInput {
    id: Int!
  }

  input UpdateDeploymentPatchInput {
    name: String
    status: DeploymentStatusType
    created: String
    started: String
    completed: String
    environment: Int
    remoteId: String
  }

  input UpdateDeploymentInput {
    id: Int!
    patch: UpdateDeploymentPatchInput!
  }

  input TaskInput {
    id: Int
    name: String!
    status: TaskStatusType
    created: String
    started: String
    completed: String
    environment: Int!
    service: String
    command: String
    remoteId: String
    execute: Boolean
  }

  input DeleteTaskInput {
    id: Int!
  }

  input UpdateTaskPatchInput {
    name: String
    status: TaskStatusType
    created: String
    started: String
    completed: String
    environment: Int
    service: String
    command: String
    remoteId: String
  }

  input UpdateTaskInput {
    id: Int!
    patch: UpdateTaskPatchInput!
  }

  input AddOpenshiftInput {
    id: Int
    name: String!
    consoleUrl: String!
    token: String
    routerPattern: String
    projectUser: String
    sshHost: String
    sshPort: String
  }

  input DeleteOpenshiftInput {
    name: String!
  }

  input DeleteCustomerInput {
    name: String!
  }

  input AddNotificationRocketChatInput {
    name: String!
    webhook: String!
    channel: String!
  }

  input AddNotificationSlackInput {
    name: String!
    webhook: String!
    channel: String!
  }

  input DeleteNotificationRocketChatInput {
    name: String!
  }

  input DeleteNotificationSlackInput {
    name: String!
  }

  input AddNotificationToProjectInput {
    project: String!
    notificationType: NotificationType!
    notificationName: String!
  }

  input RemoveNotificationFromProjectInput {
    project: String!
    notificationType: NotificationType!
    notificationName: String!
  }

  input AddUserInput {
    id: Int
    email: String!
    firstName: String
    lastName: String
    comment: String
    gitlabId: Int
  }

  input UpdateUserPatchInput {
    email: String
    firstName: String
    lastName: String
    comment: String
    gitlabId: Int
  }

  input UpdateUserInput {
    id: Int!
    patch: UpdateUserPatchInput!
  }

  input DeleteUserInput {
    id: Int!
  }

  input AddUserToProjectInput {
    project: String!
    userId: Int!
  }

  input RemoveUserFromProjectInput {
    project: String!
    userId: Int!
  }

  input AddUserToCustomerInput {
    customer: String!
    userId: Int!
  }

  input RemoveUserFromCustomerInput {
    customer: String!
    userId: Int!
  }

  input DeleteProjectInput {
    project: String!
  }

  input UpdateProjectPatchInput {
    name: String
    customer: Int
    gitUrl: String
    subfolder: String
    activeSystemsDeploy: String
    activeSystemsRemove: String
    activeSystemsTask: String
    branches: String
    productionEnvironment: String
    autoIdle: Int
    storageCalc: Int
    pullrequests: String
    openshift: Int
    openshiftProjectPattern: String
    developmentEnvironmentsLimit: Int
  }

  input UpdateProjectInput {
    id: Int!
    patch: UpdateProjectPatchInput!
  }

  input UpdateCustomerPatchInput {
    name: String
    comment: String
    privateKey: String
    created: String
  }

  input UpdateCustomerInput {
    id: Int!
    patch: UpdateCustomerPatchInput!
  }

  input UpdateOpenshiftPatchInput {
    name: String
    consoleUrl: String
    token: String
    routerPattern: String
    projectUser: String
    sshHost: String
    sshPort: String
  }

  input UpdateOpenshiftInput {
    id: Int!
    patch: UpdateOpenshiftPatchInput!
  }

  input UpdateNotificationRocketChatPatchInput {
    name: String
    webhook: String
    channel: String
  }

  input UpdateNotificationSlackPatchInput {
    name: String
    webhook: String
    channel: String
  }

  input UpdateNotificationRocketChatInput {
    name: String!
    patch: UpdateNotificationRocketChatPatchInput
  }

  input UpdateNotificationSlackInput {
    name: String!
    patch: UpdateNotificationSlackPatchInput
  }

  input UpdateSshKeyPatchInput {
    name: String
    keyValue: String
    keyType: SshKeyType
  }

  input UpdateSshKeyInput {
    id: Int!
    patch: UpdateSshKeyPatchInput!
  }

  input UpdateEnvironmentPatchInput {
    project: Int
    deployType: DeployType
    environmentType: EnvType
    openshiftProjectName: String
    route: String
    routes: String
    monitoringUrls: String
  }

  input UpdateEnvironmentInput {
    id: Int!
    patch: UpdateEnvironmentPatchInput
  }

  input EnvVariableInput {
    id: Int
    type: EnvVariableType
    typeId: Int!
    scope: EnvVariableScope
    name: String!
    value: String!
  }

  input DeleteEnvVariableInput {
    id: Int!
  }

  input SetEnvironmentServicesInput {
    environment: Int!
    services: [String]!
  }

  input UploadFilesForTaskInput {
    task: Int!,
    files: [Upload]!,
  }

  input DeleteFilesForTaskInput {
    id: Int!
  }

  type Mutation {
    addCustomer(input: AddCustomerInput!): Customer
    updateCustomer(input: UpdateCustomerInput!): Customer
    deleteCustomer(input: DeleteCustomerInput!): String
    deleteAllCustomers: String
    """
    Add Environment or update if it is already existing
    """
    addOrUpdateEnvironment(input: AddEnvironmentInput!): Environment
    updateEnvironment(input: UpdateEnvironmentInput!): Environment
    deleteEnvironment(input: DeleteEnvironmentInput!): String
    deleteAllEnvironments: String
    """
    Add or update Storage Information for Environment
    """
    addOrUpdateEnvironmentStorage(
      input: AddOrUpdateEnvironmentStorageInput!
    ): EnvironmentStorage
    addNotificationSlack(input: AddNotificationSlackInput!): NotificationSlack
    updateNotificationSlack(
      input: UpdateNotificationSlackInput!
    ): NotificationSlack
    deleteNotificationSlack(input: DeleteNotificationSlackInput!): String
    deleteAllNotificationSlacks: String
    addNotificationRocketChat(
      input: AddNotificationRocketChatInput!
    ): NotificationRocketChat
    updateNotificationRocketChat(
      input: UpdateNotificationRocketChatInput!
    ): NotificationRocketChat
    deleteNotificationRocketChat(
      input: DeleteNotificationRocketChatInput!
    ): String
    deleteAllNotificationRocketChats: String
    """
    Connect previous created Notification to a Project
    """
    addNotificationToProject(input: AddNotificationToProjectInput!): Project
    removeNotificationFromProject(
      input: RemoveNotificationFromProjectInput!
    ): Project
    removeAllNotificationsFromAllProjects: String
    addOpenshift(input: AddOpenshiftInput!): Openshift
    updateOpenshift(input: UpdateOpenshiftInput!): Openshift
    deleteOpenshift(input: DeleteOpenshiftInput!): String
    deleteAllOpenshifts: String
    addProject(input: AddProjectInput!): Project
    updateProject(input: UpdateProjectInput!): Project
    deleteProject(input: DeleteProjectInput!): String
    deleteAllProjects: String
    addSshKey(input: AddSshKeyInput!): SshKey
    updateSshKey(input: UpdateSshKeyInput!): SshKey
    deleteSshKey(input: DeleteSshKeyInput!): String
    deleteAllSshKeys: String
    removeAllSshKeysFromAllUsers: String
    addUser(input: AddUserInput!): User
    updateUser(input: UpdateUserInput!): User
    deleteUser(input: DeleteUserInput!): String
    deleteAllUsers: String
    addUserToCustomer(input: AddUserToCustomerInput!): Customer
    removeUserFromCustomer(input: RemoveUserFromCustomerInput!): Customer
    removeAllUsersFromAllCustomers: String
    addUserToProject(input: AddUserToProjectInput!): Project
    removeUserFromProject(input: RemoveUserFromProjectInput!): Project
    removeAllUsersFromAllProjects: String
    addDeployment(input: DeploymentInput!): Deployment
    deleteDeployment(input: DeleteDeploymentInput!): String
    updateDeployment(input: UpdateDeploymentInput): Deployment
    addBackup(input: AddBackupInput!): Backup
    deleteBackup(input: DeleteBackupInput!): String
    deleteAllBackups: String
    addRestore(input: AddRestoreInput!): Restore
    updateRestore(input: UpdateRestoreInput!): Restore
    createAllProjectsInKeycloak: String
    createAllProjectsInSearchguard: String
    resyncCustomersWithSearchguard: String
    createAllUsersInKeycloak: String
    addEnvVariable(input: EnvVariableInput!): EnvKeyValue
    deleteEnvVariable(input: DeleteEnvVariableInput!): String
    addTask(input: TaskInput!): Task
    taskDrushArchiveDump(environment: Int!): Task
    taskDrushSqlSync(
      sourceEnvironment: Int!
      destinationEnvironment: Int!
    ): Task
    taskDrushRsyncFiles(
      sourceEnvironment: Int!
      destinationEnvironment: Int!
    ): Task
    deleteTask(input: DeleteTaskInput!): String
    updateTask(input: UpdateTaskInput): Task
    setEnvironmentServices(input: SetEnvironmentServicesInput!): [EnvironmentService]
    uploadFilesForTask(input: UploadFilesForTaskInput!): Task
    deleteFilesForTask(input: DeleteFilesForTaskInput!): String
  }

  type Subscription {
    backupChanged(environment: Int!): Backup
    deploymentChanged(environment: Int!): Deployment
    taskChanged(environment: Int!): Task
  }
`;

module.exports = typeDefs;
