# Role-Based Access Control \(RBAC\)

Version 1.0 of Lagoon changed how you access your projects! Access to your project is handled via groups, with projects assigned to one or multiple groups. Users are added to groups with a role. Groups can also be nested within sub-groups. This change provides a lot more flexibility and the possibility to recreate real world teams within Lagoon.

## Roles

When assigning a user to a group, you need to provide a group role for that user inside this group. Each one of the 5 current existing group roles gives the user different permissions to the group and projects assigned to the group. Here are the platform-wide roles and the group roles that are currently found in Lagoon:

### Platform-Wide Roles

Platform-wide roles are typically assigned to people that manage Lagoon.

#### Platform-Wide Owner

The platform-wide owner has access to everything across all of Lagoon.

#### Platform-Wide Viewer

Similar to the platform-wide owner, except this role can only view.

#### Platform-Wide Organization Owner

The platform-wide organization owner role provides permission to create, update, delete, and all other permissions related to changes within an organization, including existing organizations. It does not grant full platform-wide owner access, this means the ability to access and deploy projects still needs to be granted via a group within an organization.

This role also has the ability to view all the deploytargets (kubernetes clusters) assigned to Lagoon so that they can be assigned to an organization when it is being created.

!!! Warning "NOTE"
    By default this role does not allow the creation of environments or the ability to trigger deployments within a project within an organization. They can add themselves to a group with a role that does grant them this permission.

### Organization Roles

#### Organization Owner

The organization owner role allows for the creation and deletion of projects, groups, and notifications within their organization.

They can add users to groups, change the roles of users within those groups, and associate projects with groups. This gives the organization owner the ability to clearly see who has access, and quickly add and remove users.

Organization owners now also have the ability to create Slack or other notifications directly, and associate those notifications with a project without requiring help from {{ defaults.helpstring }}.

Organization owners also have the ability to add and remove other owners, admins, or viewers to manage their organization.

!!! Warning "NOTE"
    By default this role does not allow organization owners to create environments or trigger deployments within a project. They can add themselves to a group with a role that does grant them this permission. When creating a project, an organization owner can opt to be added as an owner of the project default group.

#### Organization Admin

The organization admin role is the same as organization owner, except that this role cannot make changes to the owners, admins, or viewers of the organization.

#### Organization Viewer

The organization view has access to view the projects, group and user access, and notifications within their organization.

### Group Roles

#### Owner

The owner role can do everything within a group and its associated projects. They can add and manage users of a group. Be careful with this role, as it can delete projects and production environments!

!!! Danger "IMPORTANT"
    If a user has this role in a group that is within the scope of an organization, this role's ability to manage that group's users is removed. Only organization owners or admins can manage groups and their users.

#### Maintainer

The maintainer role can do everything within a group and its associated projects except deleting the project itself or the production environment. They can add and manage users of a group.

#### Developer

The developer role has SSH access only to development environments. This role cannot access, update or delete the production environment. They can run a sync task with the production environment as a source, but not as the destination. Cannot manage users of a group.

!!! Danger "IMPORTANT"
    This role does not prevent the deployment of the production environment as a deployment is triggered via a Git push! You need to make sure that your Git server prevents these users from pushing into the branch defined as production environment.

#### Reporter

The reporter role has view access only. They cannot access any environments via SSH or make modifications to them. They can run cache-clear tasks. This role is mostly used for stakeholders to have access to Lagoon UI and logging.

#### Guest

The guest role has the same privileges as the reporter role listed above.

Here is a table that lists the roles and the access they have:

### Lagoon 1.0.0 RBAC Permission Matrix

=== "Self"

    | **Name** | **Resource** | **Scope** | **Attributes** |
    | :--- | :--- | :--- | :--- |
    | addSshKey | ssh\_key | add | userID |
    | updateSshKey | ssh\_key | update | userID |
    | deleteSshKey | ssh\_key | delete | userID |
    | getUserSshKeys | ssh\_key | view:user | userID |
    | updateUser | user | update | userID |
    | deleteUser | user | delete | userID |

=== "Guest"

    | **Name** | **Resource** | **Scope** | **Attributes** |
    | :--- | :--- | :--- | :--- |
    | getBackupsByEnvironmentId | deployment | view | projectID |
    | getEnvironmentsByProjectId | environment | view | projectID |
    | getEnvironmentServicesByEnvironmentId | environment | view | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:view:development | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:view:production | projectID |
    | getEnvVarsByProjectId | env\_var | project:view | projectID |
    | addGroup | group | add |  |
    | getOpenshiftByProjectId | openshift | view | projectID |
    | addProject | project | add |  |
    | getProjectByEnvironmentId | project | view | projectID |
    | getProjectByGitUrl | project | view | projectID |
    | getProjectByName | project | view | projectID |
    | addRestore | restore | add | projectID |
    | updateRestore | restore | update | projectID |
    | taskDrushCacheClear | task | drushCacheClear:development | projectID |
    | taskDrushCacheClear | task | drushCacheClear:production | projectID |
    | taskDrushCron | task | drushCron:development | projectID |
    | taskDrushCron | task | drushCron:production | projectID |
    | getFilesByTaskId | task | view | projectID |
    | getTasksByEnvironmentId | task | view | projectID |
    | getTaskByRemoteId | task | view | projectID |
    | getTaskById | task | view | projectID |
    | addUser | user | add |  |

=== "Developer"

    | **Name** | **Resource** | **Scope** | **Attributes** |
    | :--- | :--- | :--- | :--- |
    | addBackup | backup | add | projectID |
    | getBackupsByEnvironmentId | backup | view | projectID |
    | addEnvVariable \(to Environment\) | env\_var | environment:add:development | projectID |
    | deleteEnvVariable \(from Environment\) | env\_var | environment:delete:development | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:viewValue:development | projectID |
    | addOrUpdateEnvironment | environment | addOrUpdate:development | projectID |
    | updateEnvironment | environment | update:development | projectID |
    | deleteEnvironment | environment | delete:development | projectID |
    | addDeployment | environment | deploy:development | projectID |
    | setEnvironmentServices | environment | update:development | projectID |
    | deployEnvironmentLatest | environment | deploy:development | projectID |
    | deployEnvironmentBranch | environment | deploy:development | projectID |
    | deployEnvironmentPullrequest | environment | deploy:development | projectID |
    | deployEnvironmentPromote | environment | deploy:development | projectID |
    | userCanSshToEnvironment | environment | ssh:development | projectID |
    | getNotificationsByProjectId | notification | view | projectID |
    | addTask | task | add:development | projectID |
    | taskDrushArchiveDump | task | drushArchiveDump:development | projectID |
    | taskDrushArchiveDump | task | drushArchiveDump:production | projectID |
    | taskDrushSqlDump | task | drushSqlDump:development | projectID |
    | taskDrushSqlDump | task | drushSqlDump:production | projectID |
    | taskDrushUserLogin | task | drushUserLogin:destination:development | environmentID |
    | taskDrushSqlSync | task | drushSqlSync:source:development | projectID |
    | taskDrushSqlSync | task | drushSqlSync:source:production | projectID |
    | taskDrushSqlSync | task | drushSqlSync:destination:development | projectID |
    | taskDrushRsyncFiles | task | drushRsync:source:development | projectID |
    | taskDrushRsyncFiles | task | drushRsync:source:production | projectID |
    | taskDrushRsyncFiles | task | drushRsync:destination:development | projectID |
    | deleteTask | task | delete | projectID |
    | updateTask | task | update | projectID |
    | uploadFilesForTask | task | update | projectID |
    | deleteFilesForTask | task | delete | projectID |
    | getBackupsByEnvironmentId | deployment | view | projectID |
    | getEnvironmentsByProjectId | environment | view | projectID |
    | getEnvironmentServicesBy<br />EnvironmentId | environment | view | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:view:development | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:view:production | projectID |
    | getEnvVarsByProjectId | env\_var | project:view | projectID |
    | addGroup | group | add |  |
    | getOpenshiftByProjectId | openshift | view | projectID |
    | addProject | project | add |  |
    | getProjectByEnvironmentId | project | view | projectID |
    | getProjectByGitUrl | project | view | projectID |
    | getProjectByName | project | view | projectID |
    | addRestore | restore | add | projectID |
    | updateRestore | restore | update | projectID |
    | taskDrushCacheClear | task | drushCacheClear:development | projectID |
    | taskDrushCacheClear | task | drushCacheClear:production | projectID |
    | taskDrushCron | task | drushCron:development | projectID |
    | taskDrushCron | task | drushCron:production | projectID |
    | getFilesByTaskId | task | view | projectID |
    | getTasksByEnvironmentId | task | view | projectID |
    | getTaskByRemoteId | task | view | projectID |
    | getTaskById | task | view | projectID |
    | addUser | user | add |  |

=== "Maintainer"

    | **Name** | **Resource** | **Scope** | **Attributes** |
    | :--- | :--- | :--- | :--- |
    | deleteBackup | backup | delete | projectID |
    | addEnvVariable \(to Project\) | env\_var | project:add | projectID |
    | addEnvVariable \(to Environment\) | env\_var | environment:add:production | projectID |
    | deleteEnvVariable | env\_var | delete | projectID ||
    | deleteEnvVariable \(from Project\) | env\_var | project:delete | projectID |
    | deleteEnvVariable \(from Environment\) | env\_var | environment:delete:production | projectID |
    | getEnvVarsByProjectId | env\_var | project:viewValue | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:viewValue:production | projectID |
    | addOrUpdateEnvironment | environment | addOrUpdate:production | projectID |
    | updateEnvironment | environment | update:production | projectID |
    | addDeployment | environment | deploy:production | projectID |
    | deleteDeployment | deployment | delete | projectID |
    | updateDeployment | deployment | update | projectID |
    | setEnvironmentServices | environment | update:production | projectID |
    | deployEnvironmentLatest | environment | deploy:production | projectID |
    | deployEnvironmentBranch | environment | deploy:production | projectID |
    | deployEnvironmentPullrequest | environment | deploy:production | projectID |
    | deployEnvironmentPromote | environment | deploy:production | projectID |
    | userCanSshToEnvironment | environment | ssh:production | projectID |
    | updateGroup | group | update | groupID |
    | deleteGroup | group | delete | groupID |
    | addUserToGroup | group | addUser | groupID |
    | removeUserFromGroup | group | removeUser | groupID |
    | addNotificationToProject | project | addNotification | projectID |
    | removeNotificationFromProject | project | removeNotification | projectID |
    | updateProject | project | update | projectID |
    | addGroupsToProject | project | addGroup | projectID |
    | removeGroupsFromProject | project | removeGroup | projectID |
    | addTask | task | add:production | projectID |
    | taskDrushUserLogin | task | drushUserLogin:destination:production | environmentID |
    | taskDrushSqlSync | task | drushSqlSync:destination:production | projectID |
    | taskDrushRsyncFiles | task | drushRsync:destination:production | projectID |
    | addBackup | backup | add | projectID |
    | getBackupsByEnvironmentId | backup | view | projectID |
    | addEnvVariable \(to Environment\) | env\_var | environment:add:development | projectID |
    | deleteEnvVariable \(from Environment\) | env\_var | environment:delete:development | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:viewValue:development | projectID |
    | addOrUpdateEnvironment | environment | addOrUpdate:development | projectID |
    | updateEnvironment | environment | update:development | projectID |
    | deleteEnvironment | environment | delete:development | projectID |
    | addDeployment | environment | deploy:development | projectID |
    | setEnvironmentServices | environment | update:development | projectID |
    | deployEnvironmentLatest | environment | deploy:development | projectID |
    | deployEnvironmentBranch | environment | deploy:development | projectID |
    | deployEnvironmentPullrequest | environment | deploy:development | projectID |
    | deployEnvironmentPromote | environment | deploy:development | projectID |
    | getNotificationsByProjectId | notification | view | projectID |
    | addTask | task | add:development | projectID |
    | taskDrushArchiveDump | task | drushArchiveDump:development | projectID |
    | taskDrushArchiveDump | task | drushArchiveDump:production | projectID |
    | taskDrushSqlDump | task | drushSqlDump:development | projectID |
    | taskDrushSqlDump | task | drushSqlDump:production | projectID |
    | taskDrushUserLogin | task | drushUserLogin:destination:development | environmentID |
    | taskDrushSqlSync | task | drushSqlSync:source:development | projectID |
    | taskDrushSqlSync | task | drushSqlSync:source:production | projectID |
    | taskDrushSqlSync | task | drushSqlSync:destination:development | projectID |
    | taskDrushRsyncFiles | task | drushRsync:source:development | projectID |
    | taskDrushRsyncFiles | task | drushRsync:source:production | projectID |
    | taskDrushRsyncFiles | task | drushRsync:destination:development | projectID |
    | deleteTask | task | delete | projectID |
    | updateTask | task | update | projectID |
    | uploadFilesForTask | task | update | projectID |
    | deleteFilesForTask | task | delete | projectID |
    | getBackupsByEnvironmentId | deployment | view | projectID |
    | getEnvironmentsByProjectId | environment | view | projectID |
    | getEnvironmentServicesBy<br />EnvironmentId | environment | view | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:view:development | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:view:production | projectID |
    | getEnvVarsByProjectId | env\_var | project:view | projectID |
    | addGroup | group | add |  |
    | getOpenshiftByProjectId | openshift | view | projectID |
    | addProject | project | add |  |
    | getProjectByEnvironmentId | project | view | projectID |
    | getProjectByGitUrl | project | view | projectID |
    | getProjectByName | project | view | projectID |
    | addRestore | restore | add | projectID |
    | updateRestore | restore | update | projectID |
    | taskDrushCacheClear | task | drushCacheClear:development | projectID |
    | taskDrushCacheClear | task | drushCacheClear:production | projectID |
    | taskDrushCron | task | drushCron:development | projectID |
    | taskDrushCron | task | drushCron:production | projectID |
    | getFilesByTaskId | task | view | projectID |
    | getTasksByEnvironmentId | task | view | projectID |
    | getTaskByRemoteId | task | view | projectID |
    | getTaskById | task | view | projectID |
    | addUser | user | add |  |

=== "Owner"

    | **Name** | **Resource** | **Scope** | **Attributes** |
    | :--- | :--- | :--- | :--- |
    | deleteEnvironment | environment | delete:production | projectID |
    | deleteProject | project | delete | projectID |
    | getProjectByEnvironmentId | project | viewPrivateKey | projectID |
    | getProjectByGitUrl | project | viewPrivateKey | projectID |
    | getProjectByName | project | viewPrivateKey | projectID |
    | deleteBackup | backup | delete | projectID |
    | addEnvVariable \(to Project\) | env\_var | project:add | projectID |
    | addEnvVariable \(to Environment\) | env\_var | environment:add:production | projectID |
    | deleteEnvVariable | env\_var | delete | projectID ||
    | deleteEnvVariable \(from Project\) | env\_var | project:delete | projectID |
    | deleteEnvVariable \(from Environment\) | env\_var | environment:delete:production | projectID |
    | getEnvVarsByProjectId | env\_var | project:viewValue | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:viewValue:production | projectID |
    | addOrUpdateEnvironment | environment | addOrUpdate:production | projectID |
    | updateEnvironment | environment | update:production | projectID |
    | addDeployment | environment | deploy:production | projectID |
    | deleteDeployment | deployment | delete | projectID |
    | updateDeployment | deployment | update | projectID |
    | setEnvironmentServices | environment | update:production | projectID |
    | deployEnvironmentLatest | environment | deploy:production | projectID |
    | deployEnvironmentBranch | environment | deploy:production | projectID |
    | deployEnvironmentPullrequest | environment | deploy:production | projectID |
    | deployEnvironmentPromote | environment | deploy:production | projectID |
    | updateGroup | group | update | groupID |
    | deleteGroup | group | delete | groupID |
    | addUserToGroup | group | addUser | groupID |
    | removeUserFromGroup | group | removeUser | groupID |
    | addNotificationToProject | project | addNotification | projectID |
    | removeNotificationFromProject | project | removeNotification | projectID |
    | updateProject | project | update | projectID |
    | addGroupsToProject | project | addGroup | projectID |
    | removeGroupsFromProject | project | removeGroup | projectID |
    | addTask | task | add:production | projectID |
    | taskDrushUserLogin | task | drushUserLogin:destination:production | environmentID |
    | taskDrushSqlSync | task | drushSqlSync:destination:production | projectID |
    | taskDrushRsyncFiles | task | drushRsync:destination:production | projectID |
    | addBackup | backup | add | projectID |
    | getBackupsByEnvironmentId | backup | view | projectID |
    | addEnvVariable \(to Environment\) | env\_var | environment:add:development | projectID |
    | deleteEnvVariable \(from Environment\) | env\_var | environment:delete:development | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:viewValue:development | projectID |
    | addOrUpdateEnvironment | environment | addOrUpdate:development | projectID |
    | updateEnvironment | environment | update:development | projectID |
    | deleteEnvironment | environment | delete:development | projectID |
    | addDeployment | environment | deploy:development | projectID |
    | setEnvironmentServices | environment | update:development | projectID |
    | deployEnvironmentLatest | environment | deploy:development | projectID |
    | deployEnvironmentBranch | environment | deploy:development | projectID |
    | deployEnvironmentPullrequest | environment | deploy:development | projectID |
    | deployEnvironmentPromote | environment | deploy:development | projectID |
    | getNotificationsByProjectId | notification | view | projectID |
    | addTask | task | add:development | projectID |
    | taskDrushArchiveDump | task | drushArchiveDump:development | projectID |
    | taskDrushArchiveDump | task | drushArchiveDump:production | projectID |
    | taskDrushSqlDump | task | drushSqlDump:development | projectID |
    | taskDrushSqlDump | task | drushSqlDump:production | projectID |
    | taskDrushUserLogin | task | drushUserLogin:destination:development | environmentID |
    | taskDrushSqlSync | task | drushSqlSync:source:development | projectID |
    | taskDrushSqlSync | task | drushSqlSync:source:production | projectID |
    | taskDrushSqlSync | task | drushSqlSync:destination:development | projectID |
    | taskDrushRsyncFiles | task | drushRsync:source:development | projectID |
    | taskDrushRsyncFiles | task | drushRsync:source:production | projectID |
    | taskDrushRsyncFiles | task | drushRsync:destination:development | projectID |
    | deleteTask | task | delete | projectID |
    | updateTask | task | update | projectID |
    | uploadFilesForTask | task | update | projectID |
    | deleteFilesForTask | task | delete | projectID |
    | getBackupsByEnvironmentId | deployment | view | projectID |
    | getEnvironmentsByProjectId | environment | view | projectID |
    | getEnvironmentServices<br />ByEnvironmentId | environment | view | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:view:development | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:view:production | projectID |
    | getEnvVarsByProjectId | env\_var | project:view | projectID |
    | addGroup | group | add |  |
    | getOpenshiftByProjectId | openshift | view | projectID |
    | addProject | project | add |  |
    | getProjectByEnvironmentId | project | view | projectID |
    | getProjectByGitUrl | project | view | projectID |
    | getProjectByName | project | view | projectID |
    | addRestore | restore | add | projectID |
    | updateRestore | restore | update | projectID |
    | taskDrushCacheClear | task | drushCacheClear:development | projectID |
    | taskDrushCacheClear | task | drushCacheClear:production | projectID |
    | taskDrushCron | task | drushCron:development | projectID |
    | taskDrushCron | task | drushCron:production | projectID |
    | getFilesByTaskId | task | view | projectID |
    | getTasksByEnvironmentId | task | view | projectID |
    | getTaskByRemoteId | task | view | projectID |
    | getTaskById | task | view | projectID |
    | addUser | user | add |  |

=== "Organization Viewer"

    | **Name** | **Resource** | **Scope** | **Attributes** |
    | :--- | :--- | :--- | :--- |
    | getOrganizationById | organization | view | organizationId |
    | getProjectByEnvironmentId | organization | viewProject | organizationId |
    | getGroupsByOrganizationId | organization | viewGroup | organizationId |
    | getUsersByOrganizationId | organization | viewUsers | organizationId |
    | getUserByEmailAndOrganizationId | organization | viewUser | organizationId |
    | getNotificationsByOrganizationId | organization | viewNotification | organizationId |

=== "Organization Owner"

    | **Name** | **Resource** | **Scope** | **Attributes** |
    | :--- | :--- | :--- | :--- |
    | getOrganizationById | organization | view | organizationId |
    | getProjectByEnvironmentId | organization | viewProject | organizationId |
    | getGroupsByOrganizationId | organization | viewGroup | organizationId |
    | getUsersByOrganizationId | organization | viewUsers | organizationId |
    | getUserByEmailAndOrganizationId | organization | viewUser | organizationId |
    | getNotificationsByOrganizationId | organization | viewNotification | organizationId |
    | addProject | organization | addProject | organizationId |
    | updateProject | organization | updateProject | organizationId |
    | deleteProject | organization | deleteProject | organizationId |
    | addGroup | organization | addGroup | organizationId |
    | deleteGroup | organization | removeGroup | organizationId |
    | addNotificationSlack | organization | addNotification | organizationId |
    | updateNotificationSlack | organization | updateNotification | organizationId |
    | deleteNotificationSlack | organization | removeNotification | organizationId |
    | addUserToOrganization | organization | addOwner | organizationId |
    | addUserToOrganization | organization | addViewer | organizationId |
    | updateOrganization | organization | updateOrganization | organizationId |

=== "Platform-Wide Owner"

    | **Name** | **Resource** | **Scope** | **Attributes** |
    | :--- | :--- | :--- | :--- |
    | addOrUpdateEnvironment<br />Storage | environment | storage |  |
    | addNotificationSlack | notification | add |  |
    | updateNotificationSlack | notification | update |  |
    | deleteNotificationSlack | notification | delete |  |
    | addKubernetes | kubernetes | add |  |
    | updateKubernetes | kubernetes | update |  |
    | deleteKubernetes | kubernetes | delete |  |
    | getAllOpenshifts | openshift | viewAll |  |
    | getAllProjects | project | viewAll |  |
    | addSshKey | ssh\_key | add | userID |
    | updateSshKey | ssh\_key | update | userID |
    | deleteSshKey | ssh\_key | delete | userID |
    | getUserSshKeys | ssh\_key | view:user | userID |
    | updateUser | user | update | userID |
    | deleteUser | user | delete | userID |
    | deleteEnvironment | environment | delete:production | projectID |
    | deleteProject | project | delete | projectID |
    | getProjectByEnvironmentId | project | viewPrivateKey | projectID |
    | getProjectByGitUrl | project | viewPrivateKey | projectID |
    | getProjectByName | project | viewPrivateKey | projectID |
    | deleteBackup | backup | delete | projectID |
    | addEnvVariable \(to Project\) | env\_var | project:add | projectID |
    | addEnvVariable \(to Environment\) | env\_var | environment:add:production | projectID |
    | deleteEnvVariable | env\_var | delete | projectID ||
    | deleteEnvVariable \(from Project\) | env\_var | project:delete | projectID |
    | deleteEnvVariable \(from Environment\) | env\_var | environment:delete:production | projectID |
    | getEnvVarsByProjectId | env\_var | project:viewValue | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:viewValue:production | projectID |
    | addOrUpdateEnvironment | environment | addOrUpdate:production | projectID |
    | updateEnvironment | environment | update:production | projectID |
    | allEnvironments | environment | viewAll | |
    | getEnvironmentStorageMonthBy<br />EnvironmentId | environment | storage |  |
    | getEnvironmentHoursMonthBy<br />EnvironmentId | environment | storage |  |
    | getEnvironmentHitsMonthBy<br />EnvironmentId | environment | storage |  |
    | addOrUpdateEnvironment<br />Storage | environment | storage |  |
    | addDeployment | environment | deploy:production | projectID |
    | deleteDeployment | deployment | delete | projectID |
    | updateDeployment | deployment | update | projectID |
    | setEnvironmentServices | environment | update:production | projectID |
    | deployEnvironmentLatest | environment | deploy:production | projectID |
    | deployEnvironmentBranch | environment | deploy:production | projectID |
    | deployEnvironmentPullrequest | environment | deploy:production | projectID |
    | deployEnvironmentPromote | environment | deploy:production | projectID |
    | updateGroup | group | update | groupID |
    | deleteGroup | group | delete | groupID |
    | addUserToGroup | group | addUser | groupID |
    | removeUserFromGroup | group | removeUser | groupID |
    | addNotificationToProject | project | addNotification | projectID |
    | removeNotificationFromProject | project | removeNotification | projectID |
    | updateProject | project | update | projectID |
    | addGroupsToProject | project | addGroup | projectID |
    | removeGroupsFromProject | project | removeGroup | projectID |
    | addTask | task | add:production | projectID |
    | taskDrushUserLogin | task | drushUserLogin:destination:production | environmentID |
    | taskDrushSqlSync | task | drushSqlSync:destination:production | projectID |
    | taskDrushRsyncFiles | task | drushRsync:destination:production | projectID |
    | addBackup | backup | add | projectID |
    | getBackupsByEnvironmentId | backup | view | projectID |
    | addEnvVariable \(to Environment\) | env\_var | environment:add:development | projectID |
    | deleteEnvVariable \(from Environment\) | env\_var | environment:delete:development | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:viewValue:development | projectID |
    | addOrUpdateEnvironment | environment | addOrUpdate:development | projectID |
    | updateEnvironment | environment | update:development | projectID |
    | deleteEnvironment | environment | delete:development | projectID |
    | addDeployment | environment | deploy:development | projectID |
    | setEnvironmentServices | environment | update:development | projectID |
    | deployEnvironmentLatest | environment | deploy:development | projectID |
    | deployEnvironmentBranch | environment | deploy:development | projectID |
    | deployEnvironmentPullrequest | environment | deploy:development | projectID |
    | deployEnvironmentPromote | environment | deploy:development | projectID |
    | getNotificationsByProjectId | notification | view | projectID |
    | addTask | task | add:development | projectID |
    | taskDrushArchiveDump | task | drushArchiveDump:development | projectID |
    | taskDrushArchiveDump | task | drushArchiveDump:production | projectID |
    | taskDrushSqlDump | task | drushSqlDump:development | projectID |
    | taskDrushSqlDump | task | drushSqlDump:production | projectID |
    | taskDrushUserLogin | task | drushUserLogin:destination:development | environmentID |
    | taskDrushSqlSync | task | drushSqlSync:source:development | projectID |
    | taskDrushSqlSync | task | drushSqlSync:source:production | projectID |
    | taskDrushSqlSync | task | drushSqlSync:destination:development | projectID |
    | taskDrushRsyncFiles | task | drushRsync:source:development | projectID |
    | taskDrushRsyncFiles | task | drushRsync:source:production | projectID |
    | taskDrushRsyncFiles | task | drushRsync:destination:development | projectID |
    | deleteTask | task | delete | projectID |
    | updateTask | task | update | projectID |
    | uploadFilesForTask | task | update | projectID |
    | deleteFilesForTask | task | delete | projectID |
    | getBackupsByEnvironmentId | deployment | view | projectID |
    | getEnvironmentsByProjectId | environment | view | projectID |
    | getEnvironmentServices<br />ByEnvironmentId | environment | view | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:view:development | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:view:production | projectID |
    | getEnvVarsByProjectId | env\_var | project:view | projectID |
    | addGroup | group | add |  |
    | getOpenshiftByProjectId | openshift | view | projectID |
    | addProject | project | add |  |
    | getProjectByEnvironmentId | project | view | projectID |
    | getProjectByGitUrl | project | view | projectID |
    | getProjectByName | project | view | projectID |
    | addRestore | restore | add | projectID |
    | updateRestore | restore | update | projectID |
    | taskDrushCacheClear | task | drushCacheClear:development | projectID |
    | taskDrushCacheClear | task | drushCacheClear:production | projectID |
    | taskDrushCron | task | drushCron:development | projectID |
    | taskDrushCron | task | drushCron:production | projectID |
    | getFilesByTaskId | task | view | projectID |
    | getTasksByEnvironmentId | task | view | projectID |
    | getTaskByRemoteId | task | view | projectID |
    | getTaskById | task | view | projectID |
    | addUser | user | add |  |
    | getAllOrganizations | organization | viewAll |  |
    | addOrganization | add | viewAll |  |
    | updateOrganization | update | viewAll |  |
    | deleteOrganization | delete | viewAll |  |
    | getOrganizationById | organization | view | organizationId |
    | getProjectByEnvironmentId | organization | viewProject | organizationId |
    | getGroupsByOrganizationId | organization | viewGroup | organizationId |
    | getUsersByOrganizationId | organization | viewUsers | organizationId |
    | getUserByEmailAndOrganizationId | organization | viewUser | organizationId |
    | getNotificationsByOrganizationId | organization | viewNotification | organizationId |
    | addProject | organization | addProject | organizationId |
    | updateProject | organization | updateProject | organizationId |
    | deleteProject | organization | deleteProject | organizationId |
    | addGroup | organization | addGroup | organizationId |
    | deleteGroup | organization | removeGroup | organizationId |
    | addNotificationSlack | organization | addNotification | organizationId |
    | updateNotificationSlack | organization | updateNotification | organizationId |
    | deleteNotificationSlack | organization | removeNotification | organizationId |
    | addUserToOrganization | organization | addOwner | organizationId |
    | addUserToOrganization | organization | addViewer | organizationId |
    | updateOrganization | organization | updateOrganization | organizationId |

=== "Platform-Wide Admin"

    | **Name** | **Resource** | **Scope** | **Attributes** |
    | :--- | :--- | :--- | :--- |
    | getEnvironmentStorageMonthBy<br />EnvironmentId | environment | storage |  |
    | getEnvironmentHoursMonthBy<br />EnvironmentId | environment | storage |  |
    | getEnvironmentHitsMonthBy<br />EnvironmentId | environment | storage |  |
    | getAllOpenshifts | openshift | viewAll |  |
    | addOrUpdateEnvironment<br />Storage | environment | storage |  |
    | addNotificationSlack | notification | add |  |
    | updateNotificationSlack | notification | update |  |
    | deleteNotificationSlack | notification | delete |  |
    | addKubernetes | kubernetes | add |  |
    | updateKubernetes | kubernetes | update |  |
    | deleteKubernetes | kubernetes | delete |  |
    | getAllProjects | project | viewAll |  |
    | addSshKey | ssh\_key | add | userID |
    | updateSshKey | ssh\_key | update | userID |
    | deleteSshKey | ssh\_key | delete | userID |
    | getUserSshKeys | ssh\_key | view:user | userID |
    | updateUser | user | update | userID |
    | deleteUser | user | delete | userID |
    | deleteEnvironment | environment | delete:production | projectID |
    | deleteProject | project | delete | projectID |
    | getProjectByEnvironmentId | project | viewPrivateKey | projectID |
    | getProjectByGitUrl | project | viewPrivateKey | projectID |
    | getProjectByName | project | viewPrivateKey | projectID |
    | deleteBackup | backup | delete | projectID |
    | addEnvVariable \(to Project\) | env\_var | project:add | projectID |
    | addEnvVariable \(to <br />Environment\) | env\_var | environment:add:production | projectID |
    | deleteEnvVariable | env\_var | delete | projectID ||
    | deleteEnvVariable \(from Project\) | env\_var | project:delete | projectID |
    | deleteEnvVariable \(from Environment\) | env\_var | environment:delete:production | projectID |
    | getEnvVarsByProjectId | env\_var | project:viewValue | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:viewValue:production | projectID |
    | addOrUpdateEnvironment | environment | addOrUpdate:production | projectID |
    | updateEnvironment | environment | update:production | projectID |
    | addDeployment | environment | deploy:production | projectID |
    | deleteDeployment | deployment | delete | projectID |
    | updateDeployment | deployment | update | projectID |
    | setEnvironmentServices | environment | update:production | projectID |
    | deployEnvironmentLatest | environment | deploy:production | projectID |
    | deployEnvironmentBranch | environment | deploy:production | projectID |
    | deployEnvironmentPullrequest | environment | deploy:production | projectID |
    | deployEnvironmentPromote | environment | deploy:production | projectID |
    | updateGroup | group | update | groupID |
    | deleteGroup | group | delete | groupID |
    | addUserToGroup | group | addUser | groupID |
    | removeUserFromGroup | group | removeUser | groupID |
    | addNotificationToProject | project | addNotification | projectID |
    | removeNotificationFromProject | project | removeNotification | projectID |
    | updateProject | project | update | projectID |
    | addGroupsToProject | project | addGroup | projectID |
    | removeGroupsFromProject | project | removeGroup | projectID |
    | addTask | task | add:production | projectID |
    | taskDrushUserLogin | task | drushUserLogin:destination:production | environmentID |
    | taskDrushSqlSync | task | drushSqlSync:destination:production | projectID |
    | taskDrushRsyncFiles | task | drushRsync:destination:production | projectID |
    | addBackup | backup | add | projectID |
    | getBackupsByEnvironmentId | backup | view | projectID |
    | addEnvVariable \(to <br />Environment\) | env\_var | environment:add:development | projectID |
    | deleteEnvVariable \(from Environment\) | env\_var | environment:delete:development | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:viewValue:development | projectID |
    | addOrUpdateEnvironment | environment | addOrUpdate:development | projectID |
    | updateEnvironment | environment | update:development | projectID |
    | deleteEnvironment | environment | delete:development | projectID |
    | addDeployment | environment | deploy:development | projectID |
    | setEnvironmentServices | environment | update:development | projectID |
    | deployEnvironmentLatest | environment | deploy:development | projectID |
    | deployEnvironmentBranch | environment | deploy:development | projectID |
    | deployEnvironmentPullrequest | environment | deploy:development | projectID |
    | deployEnvironmentPromote | environment | deploy:development | projectID |
    | getNotificationsByProjectId | notification | view | projectID |
    | addTask | task | add:development | projectID |
    | taskDrushArchiveDump | task | drushArchiveDump:development | projectID |
    | taskDrushArchiveDump | task | drushArchiveDump:production | projectID |
    | taskDrushSqlDump | task | drushSqlDump:development | projectID |
    | taskDrushSqlDump | task | drushSqlDump:production | projectID |
    | taskDrushUserLogin | task | drushUserLogin:destination:development | environmentID |
    | taskDrushSqlSync | task | drushSqlSync:source:development | projectID |
    | taskDrushSqlSync | task | drushSqlSync:source:production | projectID |
    | taskDrushSqlSync | task | drushSqlSync:destination:development | projectID |
    | taskDrushRsyncFiles | task | drushRsync:source:development | projectID |
    | taskDrushRsyncFiles | task | drushRsync:source:production | projectID |
    | taskDrushRsyncFiles | task | drushRsync:destination:development | projectID |
    | deleteTask | task | delete | projectID |
    | updateTask | task | update | projectID |
    | uploadFilesForTask | task | update | projectID |
    | deleteFilesForTask | task | delete | projectID |
    | getBackupsByEnvironmentId | deployment | view | projectID |
    | getEnvironmentsByProjectId | environment | view | projectID |
    | getEnvironmentServices<br />ByEnvironmentId | environment | view | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:view:development | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:view:production | projectID |
    | getEnvVarsByProjectId | env\_var | project:view | projectID |
    | addGroup | group | add |  |
    | getOpenshiftByProjectId | openshift | view | projectID |
    | addProject | project | add |  |
    | getProjectByEnvironmentId | project | view | projectID |
    | getProjectByGitUrl | project | view | projectID |
    | getProjectByName | project | view | projectID |
    | addRestore | restore | add | projectID |
    | updateRestore | restore | update | projectID |
    | taskDrushCacheClear | task | drushCacheClear:development | projectID |
    | taskDrushCacheClear | task | drushCacheClear:production | projectID |
    | taskDrushCron | task | drushCron:development | projectID |
    | taskDrushCron | task | drushCron:production | projectID |
    | getFilesByTaskId | task | view | projectID |
    | getTasksByEnvironmentId | task | view | projectID |
    | getTaskByRemoteId | task | view | projectID |
    | getTaskById | task | view | projectID |
    | addUser | user | add |  |
    | getAllOrganizations | organization | viewAll |  |
    | addOrganization | add | viewAll |  |
    | updateOrganization | update | viewAll |  |
    | deleteOrganization | delete | viewAll |  |
    | getOrganizationById | organization | view | organizationId |
    | getProjectByEnvironmentId | organization | viewProject | organizationId |
    | getGroupsByOrganizationId | organization | viewGroup | organizationId |
    | getUsersByOrganizationId | organization | viewUsers | organizationId |
    | getUserByEmailAndOrganizationId | organization | viewUser | organizationId |
    | getNotificationsByOrganizationId | organization | viewNotification | organizationId |
    | addProject | organization | addProject | organizationId |
    | updateProject | organization | updateProject | organizationId |
    | deleteProject | organization | deleteProject | organizationId |
    | addGroup | organization | addGroup | organizationId |
    | deleteGroup | organization | removeGroup | organizationId |
    | addNotificationSlack | organization | addNotification | organizationId |
    | updateNotificationSlack | organization | updateNotification | organizationId |
    | deleteNotificationSlack | organization | removeNotification | organizationId |
    | addUserToOrganization | organization | addOwner | organizationId |
    | addUserToOrganization | organization | addViewer | organizationId |
    | updateOrganization | organization | updateOrganization | organizationId |
