const { gql } = require('./util/gql');

// TODO: Split up this file

// TODO: Re-enable Prettier after the problem with escaping interpolation in
// embedded GraphQL in JS is fixed and new version released.
// Ref: https://github.com/prettier/prettier/issues/4974
// prettier-ignore
const typeDefs = gql`
  scalar Upload
  scalar Date
  scalar JSON

  enum SshKeyType {
    SSH_RSA
    SSH_ED25519
    ECDSA_SHA2_NISTP256
    ECDSA_SHA2_NISTP384
    ECDSA_SHA2_NISTP521
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
    MICROSOFTTEAMS
    EMAIL
    WEBHOOK
  }

  enum NotificationContentType {
    DEPLOYMENT
    PROBLEM
  }

  enum DeploymentStatusType {
    NEW
    PENDING
    RUNNING
    CANCELLED
    ERROR
    FAILED
    COMPLETE
    QUEUED
  }

  enum EnvVariableType {
    PROJECT
    ENVIRONMENT
  }

  enum EnvVariableScope {
    BUILD
    RUNTIME
    GLOBAL
    CONTAINER_REGISTRY
    INTERNAL_CONTAINER_REGISTRY
  }

  enum TaskStatusType {
    NEW
    PENDING
    RUNNING
    CANCELLED
    ERROR
    FAILED
    COMPLETE
    QUEUED
    ACTIVE
    SUCCEEDED
  }

  enum RestoreStatusType {
    PENDING
    SUCCESSFUL
    FAILED
  }

  enum EnvOrderType {
    NAME
    UPDATED
  }

  enum ProjectOrderType {
    NAME
    CREATED
  }

  enum ProjectAvailability {
    STANDARD
    HIGH
    POLYSITE
  }

  enum GroupRole {
    GUEST
    REPORTER
    DEVELOPER
    MAINTAINER
    OWNER
  }

  enum ProblemSeverityRating {
    NONE
    UNKNOWN
    NEGLIGIBLE
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  enum FactType {
    TEXT
    URL
    SEMVER
  }

  enum TaskPermission {
    MAINTAINER
    DEVELOPER
    GUEST
  }

  enum DeploymentSourceType {
    API
    WEBHOOK
  }

  enum TaskSourceType {
    API
  }

  scalar SeverityScore

  type AdvancedTaskDefinitionArgument {
    id: Int
    name: String
    displayName: String
    type: String
    defaultValue: String
    optional: Boolean
    range: [String]
    advancedTaskDefinition: AdvancedTaskDefinition
  }

  type AdvancedTaskDefinitionImage {
    id: Int
    name: String
    description: String
    confirmationText: String
    type: AdvancedTaskDefinitionTypes
    image: String
    service: String
    groupName: String
    environment: Int
    project: Int
    systemWide: Boolean
    permission: TaskPermission
    deployTokenInjection: Boolean
    projectKeyInjection: Boolean
    adminOnlyView: Boolean
    showUi: Boolean @deprecated(reason: "Use adminOnlyView instead")
    adminTask: Boolean @deprecated(reason: "Use deployTokenInjection and projectKeyInjection instead")
    advancedTaskDefinitionArguments: [AdvancedTaskDefinitionArgument]
    created: String
    deleted: String
  }

  type AdvancedTaskDefinitionCommand {
    id: Int
    name: String
    description: String
    confirmationText: String
    type: AdvancedTaskDefinitionTypes
    service: String
    command: String
    groupName: String
    environment: Int
    project: Int
    systemWide: Boolean
    permission: TaskPermission
    deployTokenInjection: Boolean
    projectKeyInjection: Boolean
    adminOnlyView: Boolean
    showUi: Boolean @deprecated(reason: "Use adminOnlyView instead")
    adminTask: Boolean @deprecated(reason: "Use deployTokenInjection and projectKeyInjection instead")
    advancedTaskDefinitionArguments: [AdvancedTaskDefinitionArgument]
    created: String
    deleted: String
  }

  union AdvancedTaskDefinition = AdvancedTaskDefinitionImage | AdvancedTaskDefinitionCommand

  type TaskRegistration {
    id: Int
    type: String
    name: String
    description: String
    groupName: String
    environment: Int
    project: Int
    command: String
    service: String
    permission: TaskPermission
    created: String
    deleted: String
  }


  type Workflow {
    id: Int
    name: String
    event: String
    project: Int
    advancedTaskDefinition: AdvancedTaskDefinition
  }

  input AddWorkflowInput {
    name: String
    event: String
    project: Int
    advancedTaskDefinition: Int
  }

  input DeleteWorkflowInput {
    id: Int!
  }

  input UpdateWorkflowPatchInput {
    name: String
    event: String
    project: Int
    advancedTaskDefinition: Int
  }

  input UpdateWorkflowInput {
    id: Int!
    patch: UpdateWorkflowPatchInput!
  }


  type Problem {
    id: Int
    environment: Environment
    severity: ProblemSeverityRating
    severityScore: SeverityScore
    identifier: String
    service: String
    source: String
    associatedPackage: String
    description: String
    links: String
    version: String
    fixedVersion: String
    data: String
    created: String
    deleted: String
  }

  type ProblemHarborScanMatch {
    id: Int
    name: String
    description: String
    defaultLagoonProject: String
    defaultLagoonEnvironment: String
    defaultLagoonService: String
    regex: String
  }

  input AddProblemHarborScanMatchInput {
    name: String!
    description: String!
    defaultLagoonProject: String
    defaultLagoonEnvironment: String
    defaultLagoonService: String
    regex: String!
  }

  input DeleteProblemHarborScanMatchInput {
    id: Int!
  }

  input AddProblemInput {
    id: Int
    environment: Int!
    severity: ProblemSeverityRating
    severityScore: SeverityScore
    identifier: String!
    service: String
    source: String!
    associatedPackage: String
    description: String
    links: String
    version: String
    fixedVersion: String
    data: String!
    created: String
  }

  input BulkProblem {
    severity: ProblemSeverityRating
    severityScore: SeverityScore
    identifier: String
    data: String
  }

  input DeleteProblemInput {
    environment: Int!
    identifier: String!
    service: String
  }

  input DeleteProblemsFromSourceInput {
    environment: Int!
    source: String!
    service: String!
  }

  type Fact {
    id: Int
    environment: Environment
    name: String
    value: String
    source: String
    description: String
    keyFact: Boolean
    type: FactType
    category: String
    references: [FactReference]
    service: String
  }

  input AddFactInput {
    id: Int
    environment: Int
    name: String!
    value: String!
    source: String!
    description: String!
    keyFact: Boolean
    type: FactType
    category: String
    service: String
  }

  input AddFactsInput {
    facts: [AddFactInput]!
  }

  input AddFactsByNameInput {
    project: String
    environment: String
    facts: [AddFactInput]!
  }

  input UpdateFactInputValue {
    environment: Int!
    name: String!
    value: String!
    source: String!
    description: String
    keyFact: Boolean
    type: FactType
    category: String
    service: String
  }

  input UpdateFactInput {
    environment: Int!
    patch: UpdateFactInputValue!
  }

  input DeleteFactInput {
    environment: Int!
    name: String!
  }

  input DeleteFactsFromSourceInput {
    environment: Int!
    source: String!
    service: String
  }

  type FactReference {
    id: Int
    fid: Int
    name: String
  }

  input AddFactReferenceInput {
    fid: Int!
    name: String!
  }

  input UpdateFactReferenceInputValue {
    fid: Int!
    name: String
  }

  input UpdateFactReferenceInput {
    fid: Int!
    patch: UpdateFactReferenceInputValue!
  }

  input DeleteFactReferenceInput {
    factName: String!
    referenceName: String!
    eid: Int!
  }

  input DeleteFactReferencesByFactIdInput {
    fid: Int!
  }

  enum FactFilterConnective {
    OR
    AND
  }

  enum FactFilterLHSTarget {
    FACT
    ENVIRONMENT
    PROJECT
  }

  input FactFilterAtom {
    lhsTarget: FactFilterLHSTarget
    name: String!
    contains: String!
  }
  input FactFilterInput {
    filterConnective: FactFilterConnective
    filters: [FactFilterAtom]
    skip: Int
    take: Int
    orderBy: String
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
    keyFingerprint: String
    created: String
  }

  type User {
    id: String
    email: String
    firstName: String
    lastName: String
    comment: String
    gitlabId: Int
    sshKeys: [SshKey]
    groups: [GroupInterface]
    # This just returns the group name, id and the role the user has in that group.
    # This is a neat way to visualize a users specific access without having to get all members of a group
    groupRoles: [GroupRoleInterface]
  }

  type GroupMembership {
    user: User
    role: GroupRole
  }

  type GroupRoleInterface {
    id: String
    name: String
    role: GroupRole
    groupType: String
    organization: Int
  }

  interface GroupInterface {
    id: String
    name: String
    type: String
    groups: [GroupInterface]
    members: [GroupMembership]
    memberCount: Int
    projects: [Project]
    organization: Int
  }

  type Group implements GroupInterface {
    id: String
    name: String
    type: String
    groups: [GroupInterface]
    members: [GroupMembership]
    memberCount: Int
    projects: [Project]
    organization: Int
  }

  interface OrgGroupInterface {
    id: String
    name: String
    type: String
    groups: [OrgGroupInterface]
    members: [GroupMembership]
    memberCount: Int
    projects: [OrgProject]
    organization: Int
  }

  type OrgGroup implements OrgGroupInterface {
    id: String
    name: String
    type: String
    groups: [OrgGroupInterface]
    members: [GroupMembership]
    memberCount: Int
    projects: [OrgProject]
    organization: Int
  }

  type Openshift {
    id: Int
    name: String
    consoleUrl: String
    token: String
    routerPattern: String
    projectUser: String @deprecated(reason: "Not used with RBAC permissions")
    sshHost: String
    sshPort: String
    created: String
    monitoringConfig: JSON
    friendlyName: String
    cloudProvider: String
    cloudRegion: String
    buildImage: String
    sharedBaasBucketName: String
    disabled: Boolean
  }

  type Kubernetes {
    id: Int
    name: String
    consoleUrl: String
    token: String
    routerPattern: String
    projectUser: String @deprecated(reason: "Not used with RBAC permissions")
    sshHost: String
    sshPort: String
    created: String
    monitoringConfig: JSON
    friendlyName: String
    cloudProvider: String
    cloudRegion: String
    buildImage: String
    sharedBaasBucketName: String
    disabled: Boolean
  }

  type NotificationMicrosoftTeams {
    id: Int
    name: String
    webhook: String
    contentType: String
    notificationSeverityThreshold: ProblemSeverityRating
    organization: Int
  }

  type NotificationRocketChat {
    id: Int
    name: String
    webhook: String
    channel: String
    contentType: String
    notificationSeverityThreshold: ProblemSeverityRating
    organization: Int
  }

  type NotificationSlack {
    id: Int
    name: String
    webhook: String
    channel: String
    contentType: String
    notificationSeverityThreshold: ProblemSeverityRating
    organization: Int
  }

  type NotificationEmail {
    id: Int
    name: String
    emailAddress: String
    contentType: String
    notificationSeverityThreshold: ProblemSeverityRating
    organization: Int
  }

  type NotificationWebhook {
    id: Int
    name: String
    webhook: String
    contentType: String
    notificationSeverityThreshold: ProblemSeverityRating
    organization: Int
  }

  type UnassignedNotification {
    id: Int
    name: String
    type: String
    contentType: String
    notificationSeverityThreshold: ProblemSeverityRating
  }

  union Notification = NotificationRocketChat | NotificationSlack | NotificationMicrosoftTeams | NotificationEmail | NotificationWebhook

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
    ID of organization
    """
    organization: Int
    """
    Git URL, needs to be SSH Git URL in one of these two formats
    - git@172.17.0.1/project1.git
    - ssh://git@172.17.0.1:2222/project1.git
    """
    gitUrl: String
    """
    Project Availability STANDARD|HIGH
    """
    availability: ProjectAvailability
    """
    SSH Private Key for Project
    Will be used to authenticate against the Git Repo of the Project
    Needs to be in single string separated by \`\n\`, example:
    \`\`\`
    -----BEGIN RSA PRIVATE KEY-----\nMIIJKQIBAAKCAgEA+o[...]P0yoL8BoQQG2jCvYfWh6vyglQdrDYx/o6/8ecTwXokKKh6fg1q\n-----END RSA PRIVATE KEY-----
    \`\`\`
    """
    privateKey: String
    """
    SSH Public Key for Project, can be added to git repositories to allow Lagoon read access.
    """
    publicKey: String
    """
    Set if the .lagoon.yml should be found in a subfolder
    Usefull if you have multiple Lagoon projects per Git Repository
    """
    subfolder: String
    """
    Set if the project should use a routerPattern that is different from the deploy target default
    """
    routerPattern: String
    """
    Notifications that should be sent for this project
    """
    notifications(type: NotificationType, contentType: NotificationContentType, notificationSeverityThreshold: ProblemSeverityRating): [Notification]
    activeSystemsDeploy: String @deprecated(reason: "No longer in use")
    activeSystemsPromote: String @deprecated(reason: "No longer in use")
    activeSystemsRemove: String @deprecated(reason: "No longer in use")
    activeSystemsTask: String @deprecated(reason: "No longer in use")
    activeSystemsMisc: String @deprecated(reason: "No longer in use")
    """
    Which branches should be deployed, can be one of:
    - \`true\` - all branches are deployed
    - \`false\` - no branches are deployed
    - REGEX - regex of all branches that should be deployed, example: \`^(main|staging)$\`
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
    Routes that are attached to the active environment
    """
    productionRoutes: String
    """
    The drush alias to use for the active production environment
    *Important:* This is mainly used for drupal, but could be used for other services potentially
    """
    productionAlias: String
    """
    Which environment(the name) should be marked as the production standby environment.
    *Important:* This is used to determine which environment should be marked as the standby production environment
    """
    standbyProductionEnvironment: String
    """
    Routes that are attached to the standby environment
    """
    standbyRoutes: String
    """
    The drush alias to use for the standby production environment
    *Important:* This is mainly used for drupal, but could be used for other services potentially
    """
    standbyAlias: String
    """
    What the production environment build priority should be (\`0 through 10\`)
    """
    productionBuildPriority: Int
    """
    What the development environment build priority should be (\`0 through 10\`)
    """
    developmentBuildPriority: Int
    """
    Should this project have auto idling enabled (\`1\` or \`0\`)
    """
    autoIdle: Int
    """
    Should storage for this environment be calculated (\`1\` or \`0\`)
    """
    storageCalc: Int
    """
    Should the Problems UI be available for this Project (\`1\` or \`0\`)
    """
    problemsUi: Int
    """
    Should the Facts UI be available for this Project (\`1\` or \`0\`)
    """
    factsUi: Int
    """
    Should the ability to deploy environments be disabled for this Project (\`1\` or \`0\`)
    """
    deploymentsDisabled: Int
    """
    Reference to OpenShift Object this Project should be deployed to
    """
    openshift: Openshift
    """
    Pattern of OpenShift Project/Namespace that should be generated, default: \`$\{project}-$\{environmentname}\`
    """
    openshiftProjectPattern: String
    """
    Reference to Kubernetes Object this Project should be deployed to
    """
    kubernetes: Kubernetes
    """
    Pattern of Kubernetes Namespace that should be generated, default: \`$\{project}-$\{environmentname}\`
    """
    kubernetesNamespacePattern: String
    """
    How many environments can be deployed at one timeout
    """
    developmentEnvironmentsLimit: Int
    """
    Name of the OpenShift Project/Namespace
    """
    openshiftProjectName: String
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
      """
      Filter environments by fact matching
      """
      factFilter: FactFilterInput
    ): [Environment]
    """
    Creation Timestamp of Project
    """
    created: String
    """
    Environment variables available during build-time and run-time
    """
    envVariables: [EnvKeyValue]
    """
    Which groups are directly linked to project
    """
    groups: [GroupInterface]
    """
    Metadata key/values stored against a project
    """
    metadata: JSON
    """
    DeployTargetConfigs are a way to define which deploy targets are used for a project\n
    """
    deployTargetConfigs: [DeployTargetConfig] @deprecated(reason: "Unstable API, subject to breaking changes in any release. Use at your own risk")
    """
    Build image this project will use if set
    """
    buildImage: String
    sharedBaasBucket: Boolean
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
    The version control base ref for deployments (e.g., branch name, tag, or commit id)
    """
    deployBaseRef: String
    """
    The version control head ref for deployments (e.g., branch name, tag, or commit id)
    """
    deployHeadRef: String
    """
    The title of the last deployment (PR title)
    """
    deployTitle: String
    """
    Should this environment have auto idling enabled (\`1\` or \`0\`)
    """
    autoIdle: Int
    """
    Which Environment Type this environment is, can be \`production\`, \`development\`
    """
    environmentType: String
    """
    Name of the OpenShift Project/Namespace this environment is deployed into
    """
    openshiftProjectName: String
    """
    Name of the Kubernetes Namespace this environment is deployed into
    """
    kubernetesNamespaceName: String
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
    Reference to EnvironmentHitsMonth API Object, which returns how many hits this environment generated in a specific month
    """
    hitsMonth(month: Date): EnvironmentHitsMonth
    """
    Environment variables available during build-time and run-time
    """
    envVariables: [EnvKeyValue]
    route: String
    routes: String
    monitoringUrls: String @deprecated(reason: "No longer in use")
    deployments(name: String, limit: Int): [Deployment]
    insights(type: String, limit: Int): [Insight]
    backups(includeDeleted: Boolean, limit: Int): [Backup]
    tasks(id: Int, taskName: String, limit: Int): [Task]
    advancedTasks: [AdvancedTaskDefinition]
    services: [EnvironmentService]
    problems(severity: [ProblemSeverityRating], source: [String]): [Problem]
    facts(keyFacts: Boolean, limit: Int, summary: Boolean): [Fact]
    openshift: Openshift
    openshiftProjectPattern: String
    kubernetes: Kubernetes
    kubernetesNamespacePattern: String
    workflows: [Workflow]
  }

  type EnvironmentHitsMonth {
    total: Int
  }

  type EnvironmentStorage {
    id: Int
    environment: Environment
    persistentStorageClaim: String
    bytesUsed: Float @deprecated(reason: "The value of this is kibibytes, use kibUsed instead. This will be removed in a future release.")
    kibUsed: Float
    updated: String
  }

  type EnvironmentStorageMonth {
    month: String
    bytesUsed: Float @deprecated(reason: "The value of this is kibibytes, use kibUsed instead. This will be removed in a future release.")
    kibUsed: Float
  }

  type EnvironmentHoursMonth {
    month: String
    hours: Int
  }

  type EnvironmentService {
    id: Int
    name: String
    type: String
    containers: [ServiceContainer]
    created: String
    updated: String
  }

  type ServiceContainer {
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
    """
    The size of the restored file in bytes
    """
    restoreSize: Float
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
    """
    The Lagoon URL
    """
    uiLink: String
    priority: Int
    bulkId: String
    bulkName: String
    buildStep: String
    """
    The username or email address that triggered this deployment.
    For webhook requests, the username or email address will attempt to be extracted from the webhook payload depending on the source of the webhook
    """
    sourceUser: String
    """
    The source of this task from the available deplyoment trigger types
    """
    sourceType: DeploymentSourceType
  }

  type Insight {
    id: Int
    type: String
    service: String
    created: String
    fileId: String
    data: String
    file: String!
    size: String
    environment: Environment!
    downloadUrl: String
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
    taskName: String
    status: String
    created: String
    started: String
    completed: String
    environment: Environment
    service: String
    command: String
    deployTokenInjection: Boolean
    projectKeyInjection: Boolean
    adminOnlyView: Boolean
    remoteId: String
    logs: String
    files: [File]
    """
    The username or email address that triggered the task.
    """
    sourceUser: String
    """
    The source of this task from the available task trigger types
    """
    sourceType: TaskSourceType
  }

  type AdvancedTask {
    id: Int
    name: String
    taskName: String
    status: String
    created: String
    started: String
    completed: String
    environment: Environment
    service: String
    advancedTask: String
    remoteId: String
    logs: String
    files: [File]
  }

  type ProjectFactSearchResults {
    count: Int
    projects: [Project]
  }

  type EnvironmentFactSearchResults {
    count: Int
    environments: [Environment]
  }

  type OrgUser {
    id: String
    email: String
    firstName: String
    lastName: String
    owner: Boolean
    comment: String
    groupRoles: [GroupRoleInterface]
  }

  type Organization {
    id: Int
    name: String
    friendlyName: String
    description: String
    quotaProject: Int
    quotaGroup: Int
    quotaNotification: Int
    quotaEnvironment: Int
    quotaRoute: Int
    deployTargets: [Openshift]
    projects: [OrgProject]
    environments: [OrgEnvironment]
    groups: [OrgGroupInterface]
    owners: [OrgUser]
    notifications(type: NotificationType): [Notification]
    created: String
  }

  input AddOrganizationInput {
    id: Int
    name: String!
    friendlyName: String
    description: String
    quotaProject: Int
    quotaGroup: Int
    quotaNotification: Int
    quotaEnvironment: Int
    quotaRoute: Int
  }

  input DeleteOrganizationInput {
    id: Int!
  }

  input UpdateOrganizationPatchInput {
    name: String
    friendlyName: String
    description: String
    quotaProject: Int
    quotaGroup: Int
    quotaNotification: Int
    quotaEnvironment: Int
    quotaRoute: Int
  }

  input UpdateOrganizationInput {
    id: Int!
    patch: UpdateOrganizationPatchInput!
  }

  """
  OrgProject is a small selection of fields for organization owners to view
  """
  type OrgProject {
    id: Int
    name: String
    organization: Int
    groups: [OrgGroupInterface]
    groupCount: Int
    notifications: [OrganizationNotification]
  }

  """
  OrgEnvironment is a small selection of fields for organization owners to view
  """
  type OrgEnvironment {
    id: Int
    name: String
    project: OrgProject
    deployType: String
    deployHeadRef: String
    deployTitle: String
    autoIdle: Int
    environmentType: String
    openshiftProjectName: String
    kubernetesNamespaceName: String
    updated: String
    created: String
    deleted: String
    route: String
    routes: String
    services: [EnvironmentService]
    openshift: Openshift
    kubernetes: Kubernetes
  }

  type OrganizationNotification {
    name: String
    type: NotificationType
  }

  type DeployTargetConfig {
    id: Int
    project: Project
    weight: Int
    branches: String
    pullrequests: String
    deployTarget: Openshift
    deployTargetProjectPattern: String
  }

  input AddDeployTargetConfigInput {
    id: Int
    project: Int!
    weight: Int
    branches: String!
    pullrequests: String!
    deployTarget: Int!
    deployTargetProjectPattern: String
  }

  input UpdateDeployTargetConfigPatchInput {
    weight: Int
    branches: String
    pullrequests: String
    deployTarget: Int
    deployTargetProjectPattern: String
  }

  input UpdateDeployTargetConfigInput {
    id: Int!
    patch: UpdateDeployTargetConfigPatchInput
  }

  input DeleteDeployTargetConfigInput {
    id: Int!
    project: Int!
    execute: Boolean
  }

  input DeleteEnvironmentInput {
    name: String!
    project: String!
    execute: Boolean
  }

  input MetadataKeyValue {
    key: String!
    value: String
  }

  input UpdateMetadataInput {
    id: Int!
    patch: MetadataKeyValue!
  }

  input RemoveMetadataInput {
    id: Int!
    key: String!
  }

  input ProjectOrgGroupsInput {
    project: Int!
    organization: Int!
  }

  input EnvVariableByProjectEnvironmentNameInput {
    environment: String
    project: String!
  }

  # Must provide id OR name
  input KubernetesInput {
    id: Int
    name: String
  }

  input DeploymentByNameInput {
    """
    The environment name
    """
    environment: String
    """
    The project name
    """
    project: String
    """
    The deployment name (eg, lagoon-build-abc)
    """
    name: String
  }

  type Query {
    """
    Returns the current user
    """
    me: User
    """
    Returns User Object by a given sshKey
    """
    userBySshKey(sshKey: String!): User
    """
    Returns User Object by a given sshKey Fingerprint
    """
    userBySshFingerprint(fingerprint: String!): User
    """
    Returns User Object by a given email address
    """
    userByEmail(email: String!): User
    """
    Returns Project Object by a given name
    """
    projectByName(name: String!): Project
    orgProjectByName(name: String!): OrgProject
    """
    Returns all Environment Objects for a specified Kubernetes matching given filter (all if no filter defined)
    """
    environmentsByKubernetes(kubernetes: KubernetesInput!, order: EnvOrderType, createdAfter: String, type: EnvType): [Environment]
    """
    Returns Group Object by a given name
    """
    groupByName(name: String!): GroupInterface
    groupByNameAndOrganization(name: String!, organization: Int!): OrgGroupInterface
    """
    Retrieves all users that have been added to groups within an organization.
    """
    usersByOrganization(organization: Int!): [OrgUser]
    """
    Retrieve information about a specific user within groups within an organization.
    This will only return group information if this user is in any groups within this organization
    """
    userByEmailAndOrganization(email: String!, organization: Int!): OrgUser
    """
    Returns Project Object by a given gitUrl (only the first one if there are multiple)
    """
    projectByGitUrl(gitUrl: String!): Project
    environmentByName(name: String!, project: Int!, includeDeleted: Boolean): Environment
    environmentById(id: Int!): Environment
    """
    Returns Environment Object by a given openshiftProjectName
    """
    environmentByOpenshiftProjectName(
      openshiftProjectName: String!
    ): Environment
    """
    Returns Environment Object by a given kubernetesNamespaceName
    """
    environmentByKubernetesNamespaceName(
      kubernetesNamespaceName: String!
    ): Environment
    """
    Return projects from a fact-based search
    """
    projectsByFactSearch(
      input: FactFilterInput
    ): ProjectFactSearchResults

    """
    Return environments from a fact-based search
    """
    environmentsByFactSearch(
      input: FactFilterInput
    ): EnvironmentFactSearchResults
    userCanSshToEnvironment(
      openshiftProjectName: String
      kubernetesNamespaceName: String
    ): Environment
    deploymentByRemoteId(id: String): Deployment
    deploymentByName(input: DeploymentByNameInput): Deployment
    deploymentsByBulkId(bulkId: String): [Deployment]
    deploymentsByFilter(openshifts: [Int], deploymentStatus: [DeploymentStatusType]): [Deployment]
    taskByTaskName(taskName: String): Task
    taskByRemoteId(id: String): Task
    taskById(id: Int): Task
    """
    Returns all Project Objects matching given filters (all if no filter defined)
    """
    allProjects(createdAfter: String, gitUrl: String, order: ProjectOrderType, buildImage: Boolean): [Project]
    """
    Returns all Project Objects matching metadata filters
    """
    projectsByMetadata(metadata: [MetadataKeyValue]): [Project]
    """
    Returns all OpenShift Objects
    """
    allOpenshifts(disabled: Boolean, buildImage: Boolean): [Openshift]
    """
    Returns all Kubernetes Objects
    """
    allKubernetes(disabled: Boolean, buildImage: Boolean): [Kubernetes]
    """
    Returns all Environments matching given filter (all if no filter defined)
    """
    allEnvironments(createdAfter: String, type: EnvType, order: EnvOrderType): [Environment]
    """
    Returns all Problems matching given filter (all if no filter defined)
    """
    allProblems(source: [String], project: Int, environment: Int, envType: [EnvType], identifier: String, severity: [ProblemSeverityRating]): [Problem]
    problemSources: [String]
    """
    Returns all Users
    """
    allUsers(id: String, email: String, gitlabId: Int): [User]
    """
    Returns all Groups matching given filter (all if no filter defined)
    """
    allGroups(name: String, type: String): [GroupInterface]
    """
    Returns all projects in a given group
    """
    allProjectsInGroup(input: GroupInput): [Project]
    """
    Returns LAGOON_VERSION
    """
    lagoonVersion: JSON
    """
    Returns all ProblemHarborScanMatchers
    """
    allProblemHarborScanMatchers: [ProblemHarborScanMatch] @deprecated(reason: "Harbor-Trivy integration with core removed in Lagoon 2")
    """
    Returns all AdvancedTaskDefinitions
    """
    allAdvancedTaskDefinitions: [AdvancedTaskDefinition]
    """
    Returns a single AdvancedTaskDefinition given an id
    """
    advancedTaskDefinitionById(id: Int!) : AdvancedTaskDefinition
    """
    Returns a AdvancedTaskDefinitions applicable for an environment
    """
    advancedTasksForEnvironment(environment: Int!) : [AdvancedTaskDefinition]
    """
    Returns a AdvancedTaskDefinitionArgument by Id
    """
    advancedTaskDefinitionArgumentById(id: Int!) : [AdvancedTaskDefinitionArgument]

    """
    Returns all Workflows for an environment
    """
    workflowsForEnvironment(environment: Int!) : [Workflow]

    """
    Returns the DeployTargetConfig by a deployTargetConfig Id
    """
    deployTargetConfigById(id: Int!) : DeployTargetConfig  @deprecated(reason: "Unstable API, subject to breaking changes in any release. Use at your own risk")
    """
    Returns all DeployTargetConfig by a project Id
    """
    deployTargetConfigsByProjectId(project: Int!) : [DeployTargetConfig]  @deprecated(reason: "Unstable API, subject to breaking changes in any release. Use at your own risk")
    """
    Returns all DeployTargetConfig by a deployTarget Id (aka: Openshift Id)
    """
    deployTargetConfigsByDeployTarget(deployTarget: Int!) : [DeployTargetConfig]  @deprecated(reason: "Unstable API, subject to breaking changes in any release. Use at your own risk")
    allDeployTargetConfigs: [DeployTargetConfig]  @deprecated(reason: "Unstable API, subject to breaking changes in any release. Use at your own risk")
    """
    List all organizations
    """
    allOrganizations: [Organization] @deprecated(reason: "Unstable API, subject to breaking changes in any release. Use at your own risk")
    """
    Get an organization by its ID
    """
    organizationById(id: Int!): Organization
    organizationByName(name: String!): Organization
    getGroupProjectOrganizationAssociation(input: AddGroupToOrganizationInput!): String  @deprecated(reason: "Use checkBulkImportProjectsAndGroupsToOrganization instead")
    getProjectGroupOrganizationAssociation(input: ProjectOrgGroupsInput!): String  @deprecated(reason: "Use checkBulkImportProjectsAndGroupsToOrganization instead")
    getEnvVariablesByProjectEnvironmentName(input: EnvVariableByProjectEnvironmentNameInput!): [EnvKeyValue]
    checkBulkImportProjectsAndGroupsToOrganization(input: AddProjectToOrganizationInput!): ProjectGroupsToOrganization
  }

  type ProjectGroupsToOrganization {
    projects: [Project]
    groups: [GroupInterface]
    otherOrgProjects: [Project]
    otherOrgGroups: [GroupInterface]
  }

  # Must provide id OR name
  input ProjectInput {
    id: Int
    name: String
  }

  # Must provide id OR name and project
  input EnvironmentInput {
    id: Int
    name: String
    project: ProjectInput
  }

  # Must provide id OR name and environment
  input DeploymentInput {
    id: Int
    name: String
    environment: EnvironmentInput
  }

  input AddSshKeyInput {
    id: Int
    name: String!
    keyValue: String!
    keyType: SshKeyType!
    user: UserInput!
  }

  input DeleteSshKeyInput {
    name: String!
  }

  input DeleteSshKeyByIdInput {
    id: Int!
  }

  input AddProjectInput {
    id: Int
    name: String!
    gitUrl: String!
    subfolder: String
    routerPattern: String
    openshift: Int
    openshiftProjectPattern: String
    kubernetes: Int
    kubernetesNamespacePattern: String
    activeSystemsDeploy: String
    activeSystemsPromote: String
    activeSystemsRemove: String
    activeSystemsTask: String
    activeSystemsMisc: String
    branches: String
    pullrequests: String
    productionEnvironment: String!
    productionRoutes: String
    productionAlias: String
    standbyProductionEnvironment: String
    standbyRoutes: String
    standbyAlias: String
    availability: ProjectAvailability
    autoIdle: Int
    storageCalc: Int
    developmentEnvironmentsLimit: Int
    privateKey: String
    problemsUi: Int
    factsUi: Int
    productionBuildPriority: Int
    developmentBuildPriority: Int
    deploymentsDisabled: Int
    organization: Int
    addOrgOwner: Boolean
    buildImage: String
    sharedBaasBucket: Boolean
  }

  input AddEnvironmentInput {
    id: Int
    name: String!
    project: Int!
    deployType: DeployType!
    deployBaseRef: String!
    deployHeadRef: String
    deployTitle: String
    environmentType: EnvType!
    openshiftProjectName: String
    kubernetesNamespaceName: String
    openshift: Int
    openshiftProjectPattern: String
    kubernetes: Int
    kubernetesNamespacePattern: String
  }

  input AddEnvironmentServiceInput {
    id: Int
    environment: Int!
    name: String!
    type: String!
    containers: [ServiceContainerInput]
  }

  input ServiceContainerInput {
    name: String!
  }

  input DeleteEnvironmentServiceInput {
    name: String!
    environment: Int!
  }

  input AddOrUpdateEnvironmentStorageInput {
    environment: Int!
    persistentStorageClaim: String!
    bytesUsed: Int!
    """
    Date in format 'YYYY-MM-DD'
    """
    updated: String
  }

  input AddOrUpdateStorageOnEnvironmentInput {
    environment: Int!
    persistentStorageClaim: String!
    """
    kibUsed is a float to allow for greater than 32-bit integer inputs
    """
    kibUsed: Float!
    """
    Date in format 'YYYY-MM-DD'
    """
    updated: String
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


  input AddDeploymentInput {
    id: Int
    name: String!
    status: DeploymentStatusType!
    created: String!
    started: String
    completed: String
    environment: Int!
    remoteId: String
    priority: Int
    bulkId: String
    bulkName: String
    buildStep: String
    sourceUser: String
    sourceType: DeploymentSourceType
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
    priority: Int
    bulkId: String
    bulkName: String
    buildStep: String
  }

  input UpdateDeploymentInput {
    id: Int!
    patch: UpdateDeploymentPatchInput!
  }

  input CancelDeploymentInput {
    deployment: DeploymentInput!
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
    sourceUser: String
    sourceType: TaskSourceType
  }


  input AdvancedTaskArgumentInput {
    name: String
    value: String
  }

  enum AdvancedTaskDefinitionArgumentTypes {
    NUMERIC
    STRING
    ENVIRONMENT_SOURCE_NAME
    ENVIRONMENT_SOURCE_NAME_EXCLUDE_SELF
  }

  input AdvancedTaskDefinitionArgumentInput {
    name: String
    type: AdvancedTaskDefinitionArgumentTypes
    displayName: String
    defaultValue: String
    optional: Boolean
  }

  input AdvancedTaskDefinitionArgumentValueInput {
    advancedTaskDefinitionArgumentName: String
    value: String
  }

  enum AdvancedTaskDefinitionTypes {
    COMMAND
    IMAGE
  }

  input AdvancedTaskDefinitionInput {
    name: String
    description: String
    image: String
    type: AdvancedTaskDefinitionTypes
    service: String
    command: String
    environment: Int
    project: Int
    groupName: String
    permission: TaskPermission
    advancedTaskDefinitionArguments: [AdvancedTaskDefinitionArgumentInput]
    confirmationText: String
    deployTokenInjection: Boolean
    projectKeyInjection: Boolean
    adminOnlyView: Boolean
    systemWide: Boolean
  }

  input UpdateAdvancedTaskDefinitionInput {
    id: Int!
    patch: UpdateAdvancedTaskDefinitionPatchInput!
  }

  input UpdateAdvancedTaskDefinitionPatchInput {
    name: String
    description: String
    image: String
    type: AdvancedTaskDefinitionTypes
    service: String
    command: String
    environment: Int
    project: Int
    groupName: String
    permission: TaskPermission
    advancedTaskDefinitionArguments: [AdvancedTaskDefinitionArgumentInput]
    confirmationText: String
    deployTokenInjection: Boolean
    projectKeyInjection: Boolean
    adminOnlyView: Boolean
  }

  input DeleteTaskInput {
    id: Int!
  }

  input UpdateTaskPatchInput {
    name: String
    taskName: String
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

  input CancelTaskNameInput {
    id: Int
    taskName: String
    environment: EnvironmentInput
  }

  input CancelTaskInput {
    task: CancelTaskNameInput!
  }

  input AddOpenshiftInput {
    id: Int
    name: String!
    consoleUrl: String!
    token: String
    routerPattern: String
    """
    @deprecated(reason: "Not used with RBAC permissions")
    """
    projectUser: String
    sshHost: String
    sshPort: String
    monitoringConfig: JSON
    friendlyName: String
    cloudProvider: String
    cloudRegion: String
    buildImage: String
    sharedBaasBucketName: String
    disabled: Boolean
  }

  input AddKubernetesInput {
    id: Int
    name: String!
    consoleUrl: String!
    token: String
    routerPattern: String
    """
    @deprecated(reason: "Not used with RBAC permissions")
    """
    projectUser: String
    sshHost: String
    sshPort: String
    monitoringConfig: JSON
    friendlyName: String
    cloudProvider: String
    cloudRegion: String
    buildImage: String
    sharedBaasBucketName: String
    disabled: Boolean
  }

  input DeleteOpenshiftInput {
    name: String!
  }

  input DeleteKubernetesInput {
    name: String!
  }

  input AddNotificationMicrosoftTeamsInput {
    name: String!
    webhook: String!
    organization: Int
  }
  input AddNotificationEmailInput {
    name: String!
    emailAddress: String!
    organization: Int
  }

  input AddNotificationRocketChatInput {
    name: String!
    webhook: String!
    channel: String!
    organization: Int
  }

  input AddNotificationWebhookInput {
    name: String!
    webhook: String!
    organization: Int
  }

  input AddNotificationSlackInput {
    name: String!
    webhook: String!
    channel: String!
    organization: Int
  }

  input DeleteNotificationMicrosoftTeamsInput {
    name: String!
  }
  input DeleteNotificationEmailInput {
    name: String!
  }

  input DeleteNotificationRocketChatInput {
    name: String!
  }

  input DeleteNotificationSlackInput {
    name: String!
  }

  input DeleteNotificationWebhookInput {
    name: String!
  }

  input AddNotificationToProjectInput {
    project: String!
    notificationType: NotificationType!
    notificationName: String!
    contentType: NotificationContentType
    notificationSeverityThreshold: ProblemSeverityRating
  }

  input RemoveNotificationFromProjectInput {
    project: String!
    notificationType: NotificationType!
    notificationName: String!
  }

  input AddUserInput {
    email: String!
    firstName: String
    lastName: String
    comment: String
    gitlabId: Int
    resetPassword: Boolean
  }

  input UpdateUserPatchInput {
    email: String
    firstName: String
    lastName: String
    comment: String
    gitlabId: Int
  }

  input UpdateUserInput {
    user: UserInput!
    patch: UpdateUserPatchInput!
  }

  input DeleteUserInput {
    user: UserInput!
  }

  input addUserToOrganizationInput {
    user: UserInput!
    organization: Int!
    owner: Boolean
  }

  input ResetUserPasswordInput {
    user: UserInput!
  }

  input DeleteProjectInput {
    project: String!
  }

  input UpdateProjectPatchInput {
    name: String
    gitUrl: String
    availability: ProjectAvailability
    privateKey: String
    subfolder: String
    routerPattern: String
    activeSystemsDeploy: String
    activeSystemsRemove: String
    activeSystemsTask: String
    activeSystemsMisc: String
    activeSystemsPromote: String
    branches: String
    productionEnvironment: String
    productionRoutes: String
    productionAlias: String
    standbyProductionEnvironment: String
    standbyRoutes: String
    standbyAlias: String
    autoIdle: Int
    storageCalc: Int
    pullrequests: String
    openshift: Int
    openshiftProjectPattern: String
    kubernetes: Int
    kubernetesNamespacePattern: String
    developmentEnvironmentsLimit: Int
    problemsUi: Int
    factsUi: Int
    productionBuildPriority: Int
    developmentBuildPriority: Int
    deploymentsDisabled: Int
    buildImage: String
    sharedBaasBucket: Boolean
  }

  input UpdateProjectInput {
    id: Int!
    patch: UpdateProjectPatchInput!
  }

  input AddProjectToOrganizationInput {
    project: Int!
    organization: Int!
  }

  input RemoveProjectFromOrganizationInput {
    project: Int!
    organization: Int!
  }

  input AddDeployTargetToOrganizationInput {
    deployTarget: Int!
    organization: Int!
  }

  input RemoveDeployTargetFromOrganizationInput {
    deployTarget: Int!
    organization: Int!
  }

  input UpdateOpenshiftPatchInput {
    name: String
    consoleUrl: String
    token: String
    routerPattern: String
    """
    @deprecated(reason: "Not used with RBAC permissions")
    """
    projectUser: String
    sshHost: String
    sshPort: String
    monitoringConfig: JSON
    friendlyName: String
    cloudProvider: String
    cloudRegion: String
    buildImage: String
    sharedBaasBucketName: String
    disabled: Boolean
  }

  input UpdateOpenshiftInput {
    id: Int!
    patch: UpdateOpenshiftPatchInput!
  }

  input UpdateKubernetesPatchInput {
    name: String
    consoleUrl: String
    token: String
    routerPattern: String
    """
    @deprecated(reason: "Not used with RBAC permissions")
    """
    projectUser: String
    sshHost: String
    sshPort: String
    monitoringConfig: JSON
    friendlyName: String
    cloudProvider: String
    cloudRegion: String
    buildImage: String
    sharedBaasBucketName: String
    disabled: Boolean
  }

  input UpdateKubernetesInput {
    id: Int!
    patch: UpdateKubernetesPatchInput!
  }

  input UpdateNotificationMicrosoftTeamsPatchInput {
    name: String
    webhook: String
    channel: String
  }
  input UpdateNotificationEmailPatchInput {
    name: String
    emailAddress: String
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

  input UpdateNotificationWebhookPatchInput {
    name: String
    webhook: String
  }

  input UpdateNotificationMicrosoftTeamsInput {
    name: String!
    patch: UpdateNotificationMicrosoftTeamsPatchInput
  }
  input UpdateNotificationEmailInput {
    name: String!
    patch: UpdateNotificationEmailPatchInput
  }

  input UpdateNotificationRocketChatInput {
    name: String!
    patch: UpdateNotificationRocketChatPatchInput
  }

  input UpdateNotificationSlackInput {
    name: String!
    patch: UpdateNotificationSlackPatchInput
  }

  input UpdateNotificationWebhookInput {
    name: String!
    patch: UpdateNotificationWebhookPatchInput
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
    deployBaseRef: String
    deployHeadRef: String
    deployTitle: String
    environmentType: EnvType
    openshiftProjectName: String
    kubernetesNamespaceName: String
    route: String
    routes: String
    monitoringUrls: String
    autoIdle: Int
    openshift: Int
    openshiftProjectPattern: String
    kubernetes: Int
    kubernetesNamespacePattern: String
    """
    Timestamp in format 'YYYY-MM-DD hh:mm:ss'
    """
    created: String
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

  input DeleteEnvVariableByNameInput {
    environment: String
    project: String!
    name: String!
  }

  input EnvVariableByNameInput {
    environment: String
    project: String!
    scope: EnvVariableScope
    name: String!
    value: String!
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

  input EnvKeyValueInput {
    name: String
    value: String
  }

  input DeployEnvironmentLatestInput {
    environment: EnvironmentInput!
    priority: Int
    bulkId: String
    bulkName: String
    buildVariables: [EnvKeyValueInput]
    returnData: Boolean
  }

  input DeployEnvironmentBranchInput {
    project: ProjectInput!
    branchName: String!
    branchRef: String
    priority: Int
    bulkId: String
    bulkName: String
    buildVariables: [EnvKeyValueInput]
    returnData: Boolean
  }

  input DeployEnvironmentPullrequestInput {
    project: ProjectInput!
    number: Int!
    title: String!
    baseBranchName: String!
    baseBranchRef: String!
    headBranchName: String!
    headBranchRef: String!
    priority: Int
    bulkId: String
    bulkName: String
    buildVariables: [EnvKeyValueInput]
    returnData: Boolean
  }

  input DeployEnvironmentPromoteInput {
    sourceEnvironment: EnvironmentInput!
    project: ProjectInput!
    destinationEnvironment: String!
    priority: Int
    bulkId: String
    bulkName: String
    buildVariables: [EnvKeyValueInput]
    returnData: Boolean
  }

  input switchActiveStandbyInput {
    project: ProjectInput!
  }

  input GroupInput {
    id: String
    name: String
  }

  input AddGroupInput {
    name: String!
    parentGroup: GroupInput
  }

  input AddGroupToOrganizationInput {
    name: String!
    organization: Int!
    parentGroup: GroupInput
    addOrgOwner: Boolean
  }

  input UpdateGroupPatchInput {
    name: String
  }

  input UpdateGroupInput {
    group: GroupInput!
    patch: UpdateGroupPatchInput!
  }

  input DeleteGroupInput {
    group: GroupInput!
  }

  input UserInput {
    id: String
    email: String
  }

  input UserGroupInput {
    user: UserInput!
    group: GroupInput!
  }

  input UserGroupRoleInput {
    user: UserInput!
    group: GroupInput!
    role: GroupRole!
  }

  input ProjectGroupsInput {
    project: ProjectInput!
    groups: [GroupInput!]!
  }

  input UserOrganizationInput {
    user: UserInput!
    organization: Int!
  }

  input BulkDeploymentLatestInput {
    buildVariables: [EnvKeyValueInput]
    environments: [DeployEnvironmentLatestInput!]!
    name: String
  }

  type Mutation {
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
    ): EnvironmentStorage  @deprecated(reason: "Use addOrUpdateStorageOnEnvironment instead")
    addOrUpdateStorageOnEnvironment(
      input: AddOrUpdateStorageOnEnvironmentInput!
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
    addNotificationMicrosoftTeams(
      input: AddNotificationMicrosoftTeamsInput!
    ): NotificationMicrosoftTeams
    updateNotificationMicrosoftTeams(
      input: UpdateNotificationMicrosoftTeamsInput!
    ): NotificationMicrosoftTeams
    deleteNotificationMicrosoftTeams(
      input: DeleteNotificationMicrosoftTeamsInput!
    ): String
    deleteAllNotificationMicrosoftTeams: String
    addNotificationWebhook(
      input: AddNotificationWebhookInput!
    ): NotificationWebhook
    updateNotificationWebhook(
      input: UpdateNotificationWebhookInput!
    ): NotificationWebhook
    deleteNotificationWebhook(
      input: DeleteNotificationWebhookInput!
    ): String
    deleteAllNotificationWebhook: String
    addNotificationEmail(
      input: AddNotificationEmailInput!
    ): NotificationEmail
    updateNotificationEmail(
      input: UpdateNotificationEmailInput!
    ): NotificationEmail
    deleteNotificationEmail(
      input: DeleteNotificationEmailInput!
    ): String
    deleteAllNotificationEmails: String
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
    addKubernetes(input: AddKubernetesInput!): Kubernetes
    updateKubernetes(input: UpdateKubernetesInput!): Kubernetes
    deleteKubernetes(input: DeleteKubernetesInput!): String
    deleteAllKubernetes: String
    addProject(input: AddProjectInput!): Project
    updateProject(input: UpdateProjectInput!): Project
    deleteProject(input: DeleteProjectInput!): String
    deleteAllProjects: String
    addSshKey(input: AddSshKeyInput!): SshKey
    updateSshKey(input: UpdateSshKeyInput!): SshKey
    deleteSshKey(input: DeleteSshKeyInput!): String
    deleteSshKeyById(input: DeleteSshKeyByIdInput!): String
    deleteAllSshKeys: String
    removeAllSshKeysFromAllUsers: String
    addUser(input: AddUserInput!): User
    updateUser(input: UpdateUserInput!): User
    """
    Add a user to an organization as a viewer or owner of the organization.
    This allows the user to view or manage the organizations groups, projects, and notifications
    """
    addUserToOrganization(input: addUserToOrganizationInput!): Organization
    """
    Remove a viewer or owner from an organization.
    This removes the users ability to view or manage the organizations groups, projects, and notifications
    """
    removeUserFromOrganization(input: addUserToOrganizationInput!): Organization
    resetUserPassword(input: ResetUserPasswordInput!): String
    deleteUser(input: DeleteUserInput!): String
    deleteAllUsers: String
    addDeployment(input: AddDeploymentInput!): Deployment
    bulkDeployEnvironmentLatest(input: BulkDeploymentLatestInput!): String
    deleteDeployment(input: DeleteDeploymentInput!): String
    updateDeployment(input: UpdateDeploymentInput): Deployment
    cancelDeployment(input: CancelDeploymentInput!): String
    addBackup(input: AddBackupInput!): Backup
    addProblem(input: AddProblemInput!): Problem
    addProblemHarborScanMatch(input: AddProblemHarborScanMatchInput!): ProblemHarborScanMatch @deprecated(reason: "Harbor-Trivy integration with core removed in Lagoon 2")
    deleteProblem(input: DeleteProblemInput!): String
    deleteProblemsFromSource(input: DeleteProblemsFromSourceInput!): String
    deleteProblemHarborScanMatch(input: DeleteProblemHarborScanMatchInput!): String @deprecated(reason: "Harbor-Trivy integration with core removed in Lagoon 2")
    addFact(input: AddFactInput!): Fact
    addFacts(input: AddFactsInput!): [Fact] @deprecated(reason: "Use addFactsByName instead")
    addFactsByName(input: AddFactsByNameInput!): [Fact]
    deleteFact(input: DeleteFactInput!): String
    deleteFactsFromSource(input: DeleteFactsFromSourceInput!): String
    addFactReference(input: AddFactReferenceInput!): FactReference
    deleteFactReference(input: DeleteFactReferenceInput!): String
    deleteAllFactReferencesByFactId(input: DeleteFactReferencesByFactIdInput!): String
    deleteBackup(input: DeleteBackupInput!): String
    deleteAllBackups: String
    addRestore(input: AddRestoreInput!): Restore
    updateRestore(input: UpdateRestoreInput!): Restore
    addEnvVariable(input: EnvVariableInput!): EnvKeyValue  @deprecated(reason: "Use addOrUpdateEnvVariableByName instead")
    deleteEnvVariable(input: DeleteEnvVariableInput!): String  @deprecated(reason: "Use deleteEnvVariableByName instead")
    addOrUpdateEnvVariableByName(input: EnvVariableByNameInput!): EnvKeyValue
    deleteEnvVariableByName(input: DeleteEnvVariableByNameInput!): String
    addTask(input: TaskInput!): Task
    addAdvancedTaskDefinition(input: AdvancedTaskDefinitionInput!): AdvancedTaskDefinition
    updateAdvancedTaskDefinition(input: UpdateAdvancedTaskDefinitionInput!): AdvancedTaskDefinition
    invokeRegisteredTask(advancedTaskDefinition: Int!, environment: Int!, argumentValues: [AdvancedTaskDefinitionArgumentValueInput]): Task
    deleteAdvancedTaskDefinition(advancedTaskDefinition: Int!): String
    addWorkflow(input: AddWorkflowInput!): Workflow
    updateWorkflow(input: UpdateWorkflowInput): Workflow
    deleteWorkflow(input: DeleteWorkflowInput!): String
    taskDrushArchiveDump(environment: Int!): Task @deprecated(reason: "This task will be removed in a future release. See https://github.com/uselagoon/lagoon/blob/main/DEPRECATIONS.md for alternatives if you use it")
    taskDrushSqlDump(environment: Int!): Task @deprecated(reason: "This task will be removed in a future release. See https://github.com/uselagoon/lagoon/blob/main/DEPRECATIONS.md for alternatives if you use it")
    taskDrushCacheClear(environment: Int!): Task @deprecated(reason: "This task will be removed in a future release. See https://github.com/uselagoon/lagoon/blob/main/DEPRECATIONS.md for alternatives if you use it")
    taskDrushCron(environment: Int!): Task @deprecated(reason: "This task will be removed in a future release. See https://github.com/uselagoon/lagoon/blob/main/DEPRECATIONS.md for alternatives if you use it")
    taskDrushSqlSync(
      sourceEnvironment: Int!
      destinationEnvironment: Int!
    ): Task @deprecated(reason: "This task will be removed in a future release. See https://github.com/uselagoon/lagoon/blob/main/DEPRECATIONS.md for alternatives if you use it")
    taskDrushRsyncFiles(
      sourceEnvironment: Int!
      destinationEnvironment: Int!
    ): Task @deprecated(reason: "This task will be removed in a future release. See https://github.com/uselagoon/lagoon/blob/main/DEPRECATIONS.md for alternatives if you use it")
    taskDrushUserLogin(environment: Int!): Task @deprecated(reason: "This task will be removed in a future release. See https://github.com/uselagoon/lagoon/blob/main/DEPRECATIONS.md for alternatives if you use it")
    deleteTask(input: DeleteTaskInput!): String
    updateTask(input: UpdateTaskInput): Task
    cancelTask(input: CancelTaskInput!): String
    setEnvironmentServices(input: SetEnvironmentServicesInput!): [EnvironmentService]   @deprecated(reason: "Use addOrUpdateEnvironmentService or deleteEnvironmentService")
    uploadFilesForTask(input: UploadFilesForTaskInput!): Task
    deleteFilesForTask(input: DeleteFilesForTaskInput!): String
    deployEnvironmentLatest(input: DeployEnvironmentLatestInput!): String
    deployEnvironmentBranch(input: DeployEnvironmentBranchInput!): String
    deployEnvironmentPullrequest(input: DeployEnvironmentPullrequestInput!): String
    deployEnvironmentPromote(input: DeployEnvironmentPromoteInput!): String
    switchActiveStandby(input: switchActiveStandbyInput!): Task
    addGroup(input: AddGroupInput!): GroupInterface
    updateGroup(input: UpdateGroupInput!): GroupInterface
    deleteGroup(input: DeleteGroupInput!): String
    deleteAllGroups: String
    addUserToGroup(input: UserGroupRoleInput!): GroupInterface
    removeUserFromGroup(input: UserGroupInput!): GroupInterface
    addGroupsToProject(input: ProjectGroupsInput): Project
    removeGroupsFromProject(input: ProjectGroupsInput!): Project
    """
    This is a way to quickly remove a user from all groups within an organization.
    Effectively removing all access to any projects that are assigned to those groups.
    """
    removeUserFromOrganizationGroups(input: UserOrganizationInput): Organization
    updateProjectMetadata(input: UpdateMetadataInput!): Project
    removeProjectMetadataByKey(input: RemoveMetadataInput!): Project
    addDeployTargetConfig(input: AddDeployTargetConfigInput!): DeployTargetConfig  @deprecated(reason: "Unstable API, subject to breaking changes in any release. Use at your own risk")
    updateDeployTargetConfig(input: UpdateDeployTargetConfigInput!): DeployTargetConfig  @deprecated(reason: "Unstable API, subject to breaking changes in any release. Use at your own risk")
    deleteDeployTargetConfig(input: DeleteDeployTargetConfigInput!): String  @deprecated(reason: "Unstable API, subject to breaking changes in any release. Use at your own risk")
    deleteAllDeployTargetConfigs: String  @deprecated(reason: "Unstable API, subject to breaking changes in any release. Use at your own risk")
    updateEnvironmentDeployTarget(environment: Int!, deployTarget: Int!): Environment
    """
    Add an organization
    """
    addOrganization(input: AddOrganizationInput!): Organization
    """
    Update an organization
    """
    updateOrganization(input: UpdateOrganizationInput!): Organization
    """
    Delete an organization
    """
    deleteOrganization(input: DeleteOrganizationInput!): String
    """
    Add a group to an organization
    """
    addGroupToOrganization(input: AddGroupToOrganizationInput!): OrgGroupInterface  @deprecated(reason: "Use bulkImportProjectsAndGroupsToOrganization instead")
    """
    Add an existing group to an organization
    """
    addExistingGroupToOrganization(input: AddGroupToOrganizationInput!): OrgGroupInterface  @deprecated(reason: "Use bulkImportProjectsAndGroupsToOrganization instead")
    """
    Add an existing project to an organization
    """
    addExistingProjectToOrganization(input: AddProjectToOrganizationInput): Project  @deprecated(reason: "Use bulkImportProjectsAndGroupsToOrganization instead")
    """
    Remove a project from an organization, this will return the project to a state where it has no groups or notifications associated to it
    """
    removeProjectFromOrganization(input: RemoveProjectFromOrganizationInput): Project
    """
    Add a deploytarget to an organization
    """
    addDeployTargetToOrganization(input: AddDeployTargetToOrganizationInput): Organization
    """
    Remove a deploytarget from an organization
    """
    removeDeployTargetFromOrganization(input: RemoveDeployTargetFromOrganizationInput): Organization
    """
    Run the query checkBulkImportProjectsAndGroupsToOrganization first to see the changes that would be made before executing this, as it may contain undesirable changes
    Add an existing project to an organization, this will include all the groups and all the projects that those groups contain
    Optionally detach any notifications attached to the projects, they will be need to be recreated within the organization afterwards
    This mutation performs a lot of actions, on big project and group imports, if it times out, subsequent runs will perform only the changes necessary
    """
    bulkImportProjectsAndGroupsToOrganization(input: AddProjectToOrganizationInput, detachNotification: Boolean): ProjectGroupsToOrganization
    addOrUpdateEnvironmentService(input: AddEnvironmentServiceInput!): EnvironmentService
    deleteEnvironmentService(input: DeleteEnvironmentServiceInput!): String
  }

  type Subscription {
    backupChanged(environment: Int!): Backup
    deploymentChanged(environment: Int!): Deployment
    taskChanged(environment: Int!): Task
  }
`;

module.exports = typeDefs;
