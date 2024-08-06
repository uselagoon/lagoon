# ロールベースのアクセス制御 (RBAC)

Lagoon バージョン 1.0 では、プロジェクトへのアクセス方法が変更されました。プロジェクトへのアクセスはグループ経由で処理され、プロジェクトは 1 つまたは複数のグループに割り当てられます。ユーザーはロールを持つグループに追加されます。グループはサブグループ内にネストすることもできます。この変更により、柔軟性が大幅に向上し、Lagoon 内で実際のチームを再現できるようになります。

## 役柄 { #roles }

ユーザーをグループに割り当てるときは、このグループ内でそのユーザーにグループ ロールを提供する必要があります。現在存在する 5 つのグループ ロールのそれぞれが、グループとグループに割り当てられたプロジェクトに対する異なる権限をユーザーに付与します。現在 Lagoon にあるプラットフォーム全体のロールとグループ ロールは次のとおりです。

### プラットフォーム全体のロール { #platform-wide-roles }

#### プラットフォーム全体の管理者 { #platform-wide-admin }

プラットフォーム全体の管理者は、Lagoon 全体のすべてにアクセスできます。これには、すべてのプロジェクトを削除するなどの危険な変更も含まれます。**非常に**慎重に使用してください。

#### プラットフォーム全体の所有者 { #platform-wide-owner }

プラットフォーム全体のオーナーは、グループオーナーの役割と同様にすべてのLagoonグループにアクセスできます。すべてにアクセスする必要があるが、各グループにユーザーを割り当てたくない場合に使用できます。

### 組織の役割 { #organization-roles }

#### 組織の所有者 { #organization-owner }

組織の所有者のロールにより、組織内でプロジェクト、グループ、通知を作成および削除できます。

彼らはユーザーをグループに追加し、そのグループ内のユーザーのロールを変更し、プロジェクトをグループに関連付けることができます。これにより、組織のオーナーは誰がアクセス権を持っているかを明確に把握し、ユーザーを迅速に追加・削除することができます。

組織のオーナーは、Slackやその他の通知を直接作成し、それらの通知をLagoon管理者の助けを借りずにプロジェクトに関連付けることができるようになりました。

組織の所有者は、組織を管理するために他の所有者、管理者、または閲覧者を追加および削除することもできます。

!!! Warning "注意"
    デフォルトでは、このロールは組織のオーナーがプロジェクト内で環境を作成したり、デプロイをトリガーしたりすることを許可していません。彼らは自分自身を、その権限を付与するロールを持つグループに追加することができます。プロジェクトを作成するとき、組織のオーナーはプロジェクトのデフォルトグループのオーナーとして追加されることを選択できます。

#### 組織管理者 { #organization-admin }

組織管理者の役割は組織所有者と同じですが、この役割では組織の所有者、管理者、または閲覧者に変更を加えることはできません。

#### 組織のビューア { #organization-viewer }

組織のビューワーは、自組織内のプロジェクト、グループとユーザーのアクセス、通知を表示するアクセス権を持っています。

### グループのロール { #group-roles }

#### オーナー { #owner }

オーナーのロールは、グループとその関連プロジェクト内で全てを行うことができます。彼らはグループのユーザーを追加し、管理することができます。 このロールには注意が必要です、なぜならプロジェクトや本番環境を削除することができるからです。

#### メンテナ { #maintainer }

メンテナのロールは、プロジェクト自体や本番環境を削除することを除いて、グループとその関連プロジェクト内で何でもできます。彼らはグループのユーザーを追加し、管理することができます。

#### 開発者 { #developer }

開発者ロールは開発環境へのSSHアクセスのみが許可されています。このロールは、本番環境へのアクセス、更新、削除を行うことはできません。本番環境をソースとして同期タスクを実行することはできますが、宛先として使用することはできません。また、グループのユーザー管理も行えません。

!!! Warning "重要"
    このロールは、Gitプッシュによってデプロイメントがトリガーされるため、本番環境のデプロイメントを防ぐことはありません。Gitサーバーがこれらのユーザーが本番環境として定義されたブランチにプッシュするのを防ぐように設定する必要があります。

#### レポーター { #reporter }

レポーターのロールは、閲覧アクセスのみを持っています。彼らはSSH経由で環境にアクセスしたり、それらを変更したりすることはできません。彼らはキャッシュクリアタスクを実行することができます。このロールは主に、ステークホルダーがLagoon UIとログにアクセスできるようにするために使用されます。

#### ゲスト { #guest }

ゲストのロールは、上記のレポーターのロールと同等の権限を持っています。

以下はその表です。 彼らが持つロールとアクセスをリストします:

### Lagoon 1.0.0 RBAC 権限マトリックス { #lagoon-100-rbac-permission-matrix }

=== "自分自身"

    | **名前** | **リソース** | **スコープ** | **属性** |
    | :--- | :--- | :--- | :--- |
    | addSshKey | ssh\_key | add | userID |
    | updateSshKey | ssh\_key | update | userID |
    | deleteSshKey | ssh\_key | delete | userID |
    | getUserSshKeys | ssh\_key | view:user | userID |
    | updateUser | user | update | userID |
    | deleteUser | user | delete | userID |

=== "ゲスト"

    | **名前** | **リソース** | **スコープ** | **属性** |
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

=== "開発者"

    | **名前** | **リソース** | **スコープ** | **属性** |
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

=== "メンテナー"

    | **名前** | **リソース** | **スコープ** | **属性** |
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

=== "オーナー"

    | **名前** | **リソース** | **スコープ** | **属性** |
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

=== "組織ビューア"

    | **名前** | **リソース** | **スコープ** | **属性** |
    | :--- | :--- | :--- | :--- |
    | getOrganizationById | organization | view | organizationId |
    | getProjectByEnvironmentId | organization | viewProject | organizationId |
    | getGroupsByOrganizationId | organization | viewGroup | organizationId |
    | getUsersByOrganizationId | organization | viewUsers | organizationId |
    | getUserByEmailAndOrganizationId | organization | viewUser | organizationId |
    | getNotificationsByOrganizationId | organization | viewNotification | organizationId |

=== "組織オーナー"

    | **名前** | **リソース** | **スコープ** | **属性** |
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

=== "プラットフォーム全体の所有者"

    | **名前** | **リソース** | **範囲** | **属性** |
    | :--- | :--- | :--- --- | :--- |
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

=== "プラットフォーム全体の管理者"

    | **名前** | **リソース** | **スコープ** | **属性** |
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
