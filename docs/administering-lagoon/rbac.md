# Role-Based Access Control \(RBAC\)

Version 1.0 of Lagoon changed how you access your projects! Access to your project is handled via groups, with projects assigned to one or multiple groups. Users are added to groups with a role. Groups can also be nested within sub-groups. This change provides a lot more flexibility and the possibility to recreate real world teams within Lagoon.

## Roles

When assigning a user to a group, you need to provide a group role for that user inside this group. Each one of the 5 current existing group roles gives the user different permissions to the group and projects assigned to the group. Here are the platform-wide roles and the group roles that are currently found in Lagoon:

### Platform-Wide Roles

#### Platform-Wide Admin

The platform-wide admin has access to everything across all of Lagoon. That includes dangerous mutations like deleting all projects. Use very, _very,_ **very** carefully.

#### Platform-Wide Owner

The platform-wide owner has access to every Lagoon group, like the group owner role, and can be used if you need a user that needs access to everything but you don't want to assign the user to every group.

### Group Roles

#### Owner

The owner role can do everything within a group and its associated projects. They can add and manage users of a group. Be careful with this role, as it can delete projects and production environments!

#### Maintainer

The maintainer role can do everything within a group and its associated projects except deleting the project itself or the production environment. They can add and manage users of a group.

#### Developer

The developer role has SSH access only to development environments. This role cannot access, update or delete the production environment. They can run a sync task with the production environment as a source, but not as the destination. Cannot manage users of a group.

!!! Danger "Danger:"
    IMPORTANT: This role does not prevent the deployment of the production environment as a deployment is triggered via a Git push! You need to make sure that your Git server prevents these users from pushing into the branch defined as production environment.

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
    | deleteAllKubernetes| kubernetes | deleteAll |  |
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

=== "Platform-Wide Admin"

    | **Name** | **Resource** | **Scope** | **Attributes** |
    | :--- | :--- | :--- | :--- |
    | deleteAllBackups | backup | deleteAll |  |
    | deleteAllEnvironments | environment | deleteAll |  |
    | getEnvironmentStorageMonthBy<br />EnvironmentId | environment | storage |  |
    | getEnvironmentHoursMonthBy<br />EnvironmentId | environment | storage |  |
    | getEnvironmentHitsMonthBy<br />EnvironmentId | environment | storage |  |
    | deleteAllGroups | group | deleteAll |  |
    | deleteAllNotificationSlacks | notification | deleteAll |  |
    | removeAllNotificationsFrom<br />AllProjects | notification | removeAll |  |
    | getAllOpenshifts | openshift | viewAll |  |
    | deleteAllProjects | project | deleteAll |  |
    | deleteAllSshKeys | ssh\_key | deleteAll |  |
    | removeAllSshKeysFromAllUsers | ssh\_key | removeAll |  |
    | deleteAllUsers | user | deleteAll |  |
    | addOrUpdateEnvironment<br />Storage | environment | storage |  |
    | addNotificationSlack | notification | add |  |
    | updateNotificationSlack | notification | update |  |
    | deleteNotificationSlack | notification | delete |  |
    | addKubernetes | kubernetes | add |  |
    | updateKubernetes | kubernetes | update |  |
    | deleteKubernetes | kubernetes | delete |  |
    | deleteAllKubernetes| kubernetes | deleteAll |  |
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