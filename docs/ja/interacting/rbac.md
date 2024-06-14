Translation request timed out. 組織のオーナーの役割では、自組織内でのプロジェクト、グループ、通知の作成と削除が可能です。

彼らはユーザーをグループに追加し、そのグループ内のユーザーの役割を変更し、プロジェクトをグループに関連付けることができます。これにより、組織のオーナーは誰がアクセス権を持っているかを明確に把握し、ユーザーを迅速に追加・削除することができます。

組織のオーナーは現在、直接Slackやその他の通知を作成し、それらの通知をLagoon管理者の助けを借りずにプロジェクトに関連付ける能力も持っています。

!!! 警告 "注意"
    デフォルトでは、この役割は組織のオーナーがプロジェクト内で環境を作成したり、デプロイをトリガーしたりすることを許可していません。彼らは自分自身を、その権限を付与する役割を持つグループに追加することができます。プロジェクトを作成するとき、組織のオーナーはプロジェクトのデフォルトグループのオーナーとして追加されることを選択できます。

#### 組織のビューア

組織のビューワーは、自組織内のプロジェクト、グループとユーザーのアクセス、通知を表示するアクセス権を持っています。

### グループの役割

#### オーナー

オーナーの役割は、グループとその関連プロジェクト内で全てを行うことができます。彼らはグループのユーザーを追加し、管理することができます。 この役割には注意が必要です、なぜならプロジェクトや本番環境を削除することができるからです！

#### メンテナ

メンテナの役割は、プロジェクト自体や本番環境を削除することを除いて、グループとその関連プロジェクト内で何でもできます。彼らはグループのユーザーを追加し、管理することができます。

#### 開発者

開発者の役割は、開発環境へのSSHアクセスのみを持っています。この役割では、本番環境にアクセスしたり、更新したり、削除したりすることはできません。彼らは本番環境をソースとして同期タスクを実行することができますが、宛先としてはできません。グループのユーザーを管理することはできません。

!!! 警告 "重要"
    この役割は、デプロイがGitのプッシュ経由でトリガーされるため、本番環境のデプロイを防ぎません！あなたはGitサーバーがこれらのユーザーが本番環境として定義されたブランチにプッシュするのを防ぐことを確認する必要があります。

#### レポーター

レポーターの役割は、閲覧アクセスのみを持っています。彼らはSSH経由で環境にアクセスしたり、それらを変更したりすることはできません。彼らはキャッシュクリアタスクを実行することができます。この役割は主に、ステークホルダーがLagoon UIとログにアクセスできるようにするために使用されます。

#### ゲスト

ゲストの役割は、上記のレポーターの役割と同等の権限を持っています。

以下はその表です。 彼らが持つ役割とアクセスをリストします：

### Lagoon 1.0.0 RBAC 権限マトリックス

=== "自分自身"

    | **名前** | **リソース** | **スコープ** | **属性** |
    | :--- | :--- | :--- | :--- |
    | addSshKey | ssh\_key | 追加 | userID |
    | updateSshKey | ssh\_key | 更新 | userID |
    | deleteSshKey | ssh\_key | 削除 | userID |
    | getUserSshKeys | ssh\_key | ユーザー表示 | userID |
    | updateUser | user | 更新 | userID |
    | deleteUser | user | 削除 | userID |

=== "ゲスト"

    | **名前** | **リソース** | **スコープ** | **属性** |
    | :--- | :--- | :--- | :--- |
    | getBackupsByEnvironmentId | deployment | 表示 | projectID |
    | getEnvironmentsByProjectId | environment | 表示 | projectID |
    | getEnvironmentServicesByEnvironmentId | environment | 表示 | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:development表示 | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:production表示 | projectID |
    | getEnvVarsByProjectId | env\_var | project:表示 | projectID |
    | addGroup | group | 追加 |  |
    | getOpenshiftByProjectId | openshift | 表示 | projectID |
    | addProject | project | 追加 |  |
    | getProjectBy EnvironmentId | プロジェクト | ビュー | プロジェクトID |
    | getProjectByGitUrl | プロジェクト | ビュー | プロジェクトID |
    | getProjectByName | プロジェクト | ビュー | プロジェクトID |
    | addRestore | リストア | 追加 | プロジェクトID |
    | updateRestore | リストア | 更新 | プロジェクトID |
    | taskDrushCacheClear | タスク | drushCacheClear:開発 | プロジェクトID |
    | taskDrushCacheClear | タスク | drushCacheClear:プロダクション | プロジェクトID |
    | taskDrushCron | タスク | drushCron:開発 | プロジェクトID |
    | taskDrushCron | タスク | drushCron:プロダクション | プロジェクトID |
    | getFilesByTaskId | タスク | ビュー | プロジェクトID |
    | getTasksByEnvironmentId | タスク | ビュー | プロジェクトID |
    | getTaskByRemoteId | タスク | ビュー | プロジェクトID |
    | getTaskById | タスク | ビュー | プロジェクトID |
    | addUser | ユーザー | 追加 |  |

=== "開発者"

    | **名前** | **リソース** | **スコープ** | **属性** |
    | :--- | :--- | :--- | :--- |
    | addBackup | バックアップ | 追加 | プロジェクトID |
    | getBackupsByEnvironmentId | バックアップ | ビュー | プロジェクトID |
    | addEnvVariable \(環境へ\) | env\_var | 環境:追加:開発 | プロジェクトID |
    | deleteEnvVariable \(環境から\) | env\_var | 環境:削除:開発 | プロジェクトID |
    | | getEnvVarsByEnvironmentId | env\_var | environment:viewValue:development | projectID |
    | addOrUpdateEnvironment | 環境 | addOrUpdate:development | projectID |
    | updateEnvironment | 環境 | update:development | projectID |
    | deleteEnvironment | 環境 | delete:development | projectID |
    | addDeployment | 環境 | deploy:development | projectID |
    | setEnvironmentServices | 環境 | update:development | projectID |
    | deployEnvironmentLatest | 環境 | deploy:development | projectID |
    | deployEnvironmentBranch | 環境 | deploy:development | projectID |
    | deployEnvironmentPullrequest | 環境 | deploy:development | projectID |
    | deployEnvironmentPromote | 環境 | deploy:development | projectID |
    | userCanSshToEnvironment | 環境 | ssh:development | projectID |
    | getNotificationsByProjectId | 通知 | view | projectID |
    | addTask | タスク | add:development | projectID |
    | taskDrushArchiveDump | タスク | drushArchiveDump:development | projectID |
    | taskDrushArchiveDump | タスク | drushArchiveDump:production | projectID |
    | taskDrushSqlDump | タスク | drushSqlDump:development | | projectID |
    | taskDrushSqlDump | タスク | drushSqlDump:production | プロジェクトID |
    | taskDrushUserLogin | タスク | drushUserLogin:destination:development | 環境ID |
    | taskDrushSqlSync | タスク | drushSqlSync:source:development | プロジェクトID |
    | taskDrushSqlSync | タスク | drushSqlSync:source:production | プロジェクトID |
    | taskDrushSqlSync | タスク | drushSqlSync:destination:development | プロジェクトID |
    | taskDrushRsyncFiles | タスク | drushRsync:source:development | プロジェクトID |
    | taskDrushRsyncFiles | タスク | drushRsync:source:production | プロジェクトID |
    | taskDrushRsyncFiles | タスク | drushRsync:destination:development | プロジェクトID |
    | deleteTask | タスク | 削除 | プロジェクトID |
    | updateTask | タスク | 更新 | プロジェクトID |
    | uploadFilesForTask | タスク | 更新 | プロジェクトID |
    | deleteFilesForTask | タスク | 削除 | プロジェクトID |
    | getBackupsByEnvironmentId | デプロイメント | 表示 | プロジェクトID |
    | getEnvironmentsByProjectId | 環境 | 表示 | プロジェクトID |
    | getEnvironmentServicesBy<br />EnvironmentId | 環境 | 表示 | プロジェクトID |
    | getEnvVarsByEnvironmentId | env\_var | environment:view:development | プロジェクトID |
    | getEnvVarsByEnvironmentId | env_var | 環境:view:production | projectID |
    | getEnvVarsByProjectId | env_var | project:view | projectID |
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
    | deleteBackup | バックアップ | 削除 | projectID |
    | addEnvVariable \(プロジェクトに\) | env\_var | project:add | projectID |
    | addEnvVariable \(環境に\) | env\_var | environment:add:production | projectID |
    | deleteEnvVariable | env\_var | 削除 | projectID ||
    | deleteEnvVariable \(プロジェクトから\) | env\_var | project:削除 | projectID |
    | deleteEnvVariable \(環境から\) | env\_var | environment:削除:production | projectID |
    | getEnvVarsByProjectId | env\_var | project:viewValue | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:viewValue:production | projectID |
    | addOrUpdateEnvironment | environment | addOrUpdate:production | projectID |
    | updateEnvironment | environment | 更新:production | projectID |
    | addDeployment | environment | deploy:production | projectID |
    | deleteDeployment | deployment | 削除 | projectID |
    | updateDeployment | deployment | 更新 | projectID |
    | setEnvironmentServices | environment | 更新:production | projectID |
    | deployEnvironmentLatest | environment | deploy:production | projectID |
    | deployEnvironmentBranch | environment | deploy:production | projectID |
    | deployEnvironmentPull 要求 | 環境 | 展開:製品 | プロジェクトID |
    | deployEnvironmentPromote | 環境 | 展開:製品 | プロジェクトID |
    | userCanSshToEnvironment | 環境 | ssh:製品 | プロジェクトID |
    | updateGroup | グループ | アップデート | グループID |
    | deleteGroup | グループ | 削除 | グループID |
    | addUserToGroup | グループ | ユーザー追加 | グループID |
    | removeUserFromGroup | グループ | ユーザー削除 | グループID |
    | addNotificationToProject | プロジェクト | 通知追加 | プロジェクトID |
    | removeNotificationFromProject | プロジェクト | 通知削除 | プロジェクトID |
    | updateProject | プロジェクト | アップデート | プロジェクトID |
    | addGroupsToProject | プロジェクト | グループ追加 | プロジェクトID |
    | removeGroupsFromProject | プロジェクト | グループ削除 | プロジェクトID |
    | addTask | タスク | 追加:製品 | プロジェクトID |
    | taskDrushUserLogin | タスク | drushUserLogin:destination:製品 | 環境ID |
    | taskDrushSqlSync | タスク | drushSqlSync:destination:製品 | プロジェクトID |
    | taskDrushRsyncFiles | タスク | drushRsync:destination:製品 | プロジェクトID |
    | addBackup | バックアップ | 追加 | プロジェクトID |
    | getBackupsByEnvironmentId | バックアップ | 表示 | プロジェクトID |
    | addEnvVariable \(to Environment | env_var | environment:add:development | projectID |
    | deleteEnvVariable（環境から） | env_var | environment:delete:development | projectID |
    | getEnvVarsByEnvironmentId | env_var | environment:viewValue:development | projectID |
    | addOrUpdateEnvironment | 環境 | addOrUpdate:development | projectID |
    | updateEnvironment | 環境 | update:development | projectID |
    | deleteEnvironment | 環境 | delete:development | projectID |
    | addDeployment | 環境 | deploy:development | projectID |
    | setEnvironmentServices | 環境 | update:development | projectID |
    | deployEnvironmentLatest | 環境 | deploy:development | projectID |
    | deployEnvironmentBranch | 環境 | deploy:development | projectID |
    | deployEnvironmentPullrequest | 環境 | deploy:development | projectID |
    | deployEnvironmentPromote | 環境 | deploy:development | projectID |
    | getNotificationsByProjectId | 通知 | view | projectID |
    | addTask | タスク | add:development | projectID |
    | taskDrushArchiveDump | タスク | drushArchiveDump:development | projectID |
    | taskDrushArchiveDump | タスク | drush ArchiveDump:production | projectID |
    | taskDrushSqlDump | タスク | drushSqlDump:development | プロジェクトID |
    | taskDrushSqlDump | タスク | drushSqlDump:production | プロジェクトID |
    | taskDrushUserLogin | タスク | drushUserLogin:destination:development | 環境ID |
    | taskDrushSqlSync | タスク | drushSqlSync:source:development | プロジェクトID |
    | taskDrushSqlSync | タスク | drushSqlSync:source:production | プロジェクトID |
    | taskDrushSqlSync | タスク | drushSqlSync:destination:development | プロジェクトID |
    | taskDrushRsyncFiles | タスク | drushRsync:source:development | プロジェクトID |
    | taskDrushRsyncFiles | タスク | drushRsync:source:production | プロジェクトID |
    | taskDrushRsyncFiles | タスク | drushRsync:destination:development | プロジェクトID |
    | deleteTask | タスク | 削除 | プロジェクトID |
    | updateTask | タスク | 更新 | プロジェクトID |
    | uploadFilesForTask | タスク | 更新 | プロジェクトID |
    | deleteFilesForTask | タスク | 削除 | プロジェクトID |
    | getBackupsByEnvironmentId | デプロイメント | 表示 | プロジェクトID |
    | getEnvironmentsByProjectId | 環境 | 表示 | プロジェクトID |
    | getEnvironmentServicesBy<br />EnvironmentId | 環境 | 表示 | プロジェクトID |
    | getEnvVarsByEnvironment Id | env\_var | 環境：ビュー：開発 | プロジェクトID |
    | getEnvVarsByEnvironmentId | env\_var | 環境：ビュー：製品 | プロジェクトID |
    | getEnvVarsByProjectId | env\_var | プロジェクト：ビュー | プロジェクトID |
    | addGroup | グループ | 追加 |  |
    | getOpenshiftByProjectId | openshift | ビュー | プロジェクトID |
    | addProject | プロジェクト | 追加 |  |
    | getProjectByEnvironmentId | プロジェクト | ビュー | プロジェクトID |
    | getProjectByGitUrl | プロジェクト | ビュー | プロジェクトID |
    | getProjectByName | プロジェクト | ビュー | プロジェクトID |
    | addRestore | リストア | 追加 | プロジェクトID |
    | updateRestore | リストア | 更新 | プロジェクトID |
    | taskDrushCacheClear | タスク | drushCacheClear:開発 | プロジェクトID |
    | taskDrushCacheClear | タスク | drushCacheClear:製品 | プロジェクトID |
    | taskDrushCron | タスク | drushCron:開発 | プロジェクトID |
    | taskDrushCron | タスク | drushCron:製品 | プロジェクトID |
    | getFilesByTaskId | タスク | ビュー | プロジェクトID |
    | getTasksByEnvironmentId | タスク | ビュー | プロジェクトID |
    | getTaskByRemoteId | タスク | ビュー | プロジェクトID |
    | getTaskById | タスク | ビュー | プロジェクトID |
    | addUser | ユーザー | 追加 |  |

=== "オーナー"

    | **名前** | **リソース** | **スコープ** | **属性** |
    | :--- | :--- | :--- | :--- |
    | deleteEnvironment | 環境 | delete:production | projectID |
    | deleteProject | プロジェクト | 削除 | projectID |
    | getProjectByEnvironmentId | プロジェクト | viewPrivateKey | projectID |
    | getProjectByGitUrl | プロジェクト | viewPrivateKey | projectID |
    | getProjectByName | プロジェクト | viewPrivateKey | projectID |
    | deleteBackup | バックアップ | 削除 | projectID |
    | addEnvVariable \(to Project\) | env\_var | project:追加 | projectID |
    | addEnvVariable \(to Environment\) | env\_var | environment:追加:production | projectID |
    | deleteEnvVariable | env\_var | 削除 | projectID ||
    | deleteEnvVariable \(from Project\) | env\_var | project:削除 | projectID |
    | deleteEnvVariable \(from Environment\) | env\_var | environment:削除:production | projectID |
    | getEnvVarsByProjectId | env\_var | project:viewValue | projectID |
    | getEnvVarsByEnvironmentId | env\_var | environment:viewValue:production | projectID |
    | addOrUpdateEnvironment | 環境 | addOrUpdate:production | projectID |
    | updateEnvironment | 環境 | update:production | projectID |
    | addDeployment | 環境 | deploy:production | projectID |
    | deleteDeployment | 配置 | 削除 | projectID |
    | updateDeployment | 配置 | 更新 | projectID |
    | setEnvironmentServices | 環境 | update:production | projectID |
    | deployEnvironmentLatest | 環境 | deploy:production | projectID |
    | deployEnvironmentBranch | 環境 | deploy:production | projectID |
    | deployEnvironmentPullrequest | 環境 | deploy:production | projectID |
    | deployEnvironmentPromote | 環境 | deploy:production | projectID |
    | updateGroup | グループ | 更新 | groupID |
    | deleteGroup | グループ | 削除 | groupID |
    | addUserToGroup | グループ | addUser | groupID |
    | removeUserFromGroup | グループ | removeUser | groupID |
    | addNotificationToProject | プロジェクト | addNotification | projectID |
    | removeNotificationFromProject | プロジェクト | removeNotification | projectID |
    | updateProject | プロジェクト | 更新 | projectID |
    | addGroupsToProject | プロジェクト | addGroup | projectID |
    | removeGroupsFromProject | プロジェクト | removeGroup | projectID |
    | addTask | タスク | add:production | projectID |
    | taskDrushUserLogin | タスク | drushUserLogin:destination: 生産 | 環境ID |
    | taskDrushSqlSync | タスク | drushSqlSync:destination:production | プロジェクトID |
    | taskDrushRsyncFiles | タスク | drushRsync:destination:production | プロジェクトID |
    | addBackup | バックアップ | 追加 | プロジェクトID |
    | getBackupsByEnvironmentId | バックアップ | 表示 | プロジェクトID |
    | addEnvVariable \(to Environment\) | env\_var | environment:add:development | プロジェクトID |
    | deleteEnvVariable \(from Environment\) | env\_var | environment:delete:development | プロジェクトID |
    | getEnvVarsByEnvironmentId | env\_var | environment:viewValue:development | プロジェクトID |
    | addOrUpdateEnvironment | 環境 | addOrUpdate:development | プロジェクトID |
    | updateEnvironment | 環境 | update:development | プロジェクトID |
    | deleteEnvironment | 環境 | delete:development | プロジェクトID |
    | addDeployment | 環境 | deploy:development | プロジェクトID |
    | setEnvironmentServices | 環境 | update:development | プロジェクトID |
    | deployEnvironmentLatest | 環境 | deploy:development | プロジェクトID |
    | deployEnvironmentBranch | 環境 | deploy:development | プロジェクトID |
    | deployEnvironmentPullrequest | 環境 | deploy:development | プロジェクトID | projectID |
    | deployEnvironmentPromote | 環境 | deploy:development | projectID |
    | getNotificationsByProjectId | 通知 | view | projectID |
    | addTask | タスク | add:development | projectID |
    | taskDrushArchiveDump | タスク | drushArchiveDump:development | projectID |
    | taskDrushArchiveDump | タスク | drushArchiveDump:production | projectID |
    | taskDrushSqlDump | タスク | drushSqlDump:development | projectID |
    | taskDrushSqlDump | タスク | drushSqlDump:production | projectID |
    | taskDrushUserLogin | タスク | drushUserLogin:destination:development | environmentID |
    | taskDrushSqlSync | タスク | drushSqlSync:source:development | projectID |
    | taskDrushSqlSync | タスク | drushSqlSync:source:production | projectID |
    | taskDrushSqlSync | タスク | drushSqlSync:destination:development | projectID |
    | taskDrushRsyncFiles | タスク | drushRsync:source:development | projectID |
    | taskDrushRsyncFiles | タスク | drushRsync:source:production | projectID |
    | taskDrushRsyncFiles | タスク | drushRsync:destination:development | projectID |
    | deleteTask | タスク | delete | projectID |
    | updateTask | タスク | update | projectID |
    | uploadFilesFor タスク | task | 更新 | projectID |
    | deleteFilesForTask | task | 削除 | projectID |
    | getBackupsByEnvironmentId | deployment | ビュー | projectID |
    | getEnvironmentsByProjectId | 環境 | ビュー | projectID |
    | getEnvironmentServices<br />ByEnvironmentId | 環境 | ビュー | projectID |
    | getEnvVarsByEnvironmentId | env\_var | 環境:ビュー:開発 | projectID |
    | getEnvVarsByEnvironmentId | env\_var | 環境:ビュー:プロダクション | projectID |
    | getEnvVarsByProjectId | env\_var | プロジェクト:ビュー | projectID |
    | addGroup | グループ | 追加 |  |
    | getOpenshiftByProjectId | openshift | ビュー | projectID |
    | addProject | プロジェクト | 追加 |  |
    | getProjectByEnvironmentId | プロジェクト | ビュー | projectID |
    | getProjectByGitUrl | プロジェクト | ビュー | projectID |
    | getProjectByName | プロジェクト | ビュー | projectID |
    | addRestore | リストア | 追加 | projectID |
    | updateRestore | リストア | 更新 | projectID |
    | taskDrushCacheClear | タスク | drushCacheClear:開発 | projectID |
    | taskDrushCacheClear | タスク | drushCacheClear:プロダクション | projectID |
    | taskDrushCron | タスク | drushCron:開発 | projectID |
    | taskDrushCron | タスク | drushCron:production | projectID |
    | getFilesByTaskId | タスク | ビュー | projectID |
    | getTasksByEnvironmentId | タスク | ビュー | projectID |
    | getTaskByRemoteId | タスク | ビュー | projectID |
    | getTaskById | タスク | ビュー | projectID |
    | addUser | ユーザー | 追加 |  |

=== "組織ビューア"

    | **名前** | **リソース** | **スコープ** | **属性** |
    | :--- | :--- | :--- | :--- |
    | getOrganizationById | 組織 | ビュー | organizationId |
    | getProjectByEnvironmentId | 組織 | viewProject | organizationId |
    | getGroupsByOrganizationId | 組織 | viewGroup | organizationId |
    | getUsersByOrganizationId | 組織 | viewUsers | organizationId |
    | getUserByEmailAndOrganizationId | 組織 | viewUser | organizationId |
    | getNotificationsByOrganizationId | 組織 | viewNotification | organizationId |

=== "組織オーナー"

    | **名前** | **リソース** | **スコープ** | **属性** |
    | :--- | :--- | :--- | :--- |
    | getOrganizationById | 組織 | ビュー | organizationId |
    | getProjectByEnvironmentId | 組織 | viewProject | organizationId |
    | getGroupsByOrganizationId | 組織 | | viewGroup | 組織Id |
    | getUsersByOrganizationId | 組織 | viewUsers | 組織Id |
    | getUserByEmailAndOrganizationId | 組織 | viewUser | 組織Id |
    | getNotificationsByOrganizationId | 組織 | viewNotification | 組織Id |
    | addProject | 組織 | addProject | 組織Id |
    | updateProject | 組織 | updateProject | 組織Id |
    | deleteProject | 組織 | deleteProject | 組織Id |
    | addGroup | 組織 | addGroup | 組織Id |
    | deleteGroup | 組織 | removeGroup | 組織Id |
    | addNotificationSlack | 組織 | addNotification | 組織Id |
    | updateNotificationSlack | 組織 | updateNotification | 組織Id |
    | deleteNotificationSlack | 組織 | removeNotification | 組織Id |
    | addUserToOrganization | 組織 | addOwner | 組織Id |
    | addUserToOrganization | 組織 | addViewer | 組織Id |
    | updateOrganization | 組織 | updateOrganization | 組織Id |

=== "プラットフォーム全体の所有者"

    | **名前** | **リソース** | **範囲** | **属性** |
    | :--- | :--- | :--- --- | :--- |
    | addOrUpdateEnvironment<br />Storage | 環境 | ストレージ | 追加または更新 |
    | addNotificationSlack | 通知 | スラック | 追加 |
    | updateNotificationSlack | 通知 | スラック | 更新 |
    | deleteNotificationSlack | 通知 | スラック | 削除 |
    | addKubernetes | kubernetes | 追加 |  |
    | updateKubernetes | kubernetes | 更新 |  |
    | deleteKubernetes | kubernetes | 削除 |  |
    | deleteAllKubernetes| kubernetes | 全削除 |  |
    | getAllOpenshifts | openshift | 全表示 |  |
    | getAllProjects | プロジェクト | 全表示 |  |
    | addSshKey | ssh\_key | 追加 | ユーザーID |
    | updateSshKey | ssh\_key | 更新 | ユーザーID |
    | deleteSshKey | ssh\_key | 削除 | ユーザーID |
    | getUserSshKeys | ssh\_key | ユーザー表示 | ユーザーID |
    | updateUser | ユーザー | 更新 | ユーザーID |
    | deleteUser | ユーザー | 削除 | ユーザーID |
    | deleteEnvironment | 環境 | 本番環境削除 | プロジェクトID |
    | deleteProject | プロジェクト | 削除 | プロジェクトID |
    | getProjectByEnvironmentId | プロジェクト | 秘密鍵表示 | プロジェクトID |
    | getProjectByGitUrl | プロジェクト | 秘密鍵表示 | プロジェクトID |
    | getProjectByName | プロジェクト | 秘密鍵表示 | プロジェクトID |
    | deleteBackup | バックアップ | 削除 |  | | 削除 | projectID |
    | addEnvVariable \(プロジェクトへ\) | env\_var | project:add | projectID |
    | addEnvVariable \(環境へ\) | env\_var | environment:add:production | projectID |
    | deleteEnvVariable | env\_var | delete | projectID ||
    | deleteEnvVariable \(プロジェクトから\) | env\_var | project:delete | projectID |
    | deleteEnvVariable \(環境から\) | env\_var | environment:delete:production | projectID |
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
    | 削除 デプロイメント | deployment | 削除 | projectID |
    | updateDeployment | deployment | 更新 | projectID |
    | setEnvironmentServices | 環境 | 更新:本番 | projectID |
    | deployEnvironmentLatest | 環境 | デプロイ:本番 | projectID |
    | deployEnvironmentBranch | 環境 | デプロイ:本番 | projectID |
    | deployEnvironmentPullrequest | 環境 | デプロイ:本番 | projectID |
    | deployEnvironmentPromote | 環境 | デプロイ:本番 | projectID |
    | updateGroup | グループ | 更新 | groupID |
    | deleteGroup | グループ | 削除 | groupID |
    | addUserToGroup | グループ | addUser | groupID |
    | removeUserFromGroup | グループ | removeUser | groupID |
    | addNotificationToProject | プロジェクト | addNotification | projectID |
    | removeNotificationFromProject | プロジェクト | removeNotification | projectID |
    | updateProject | プロジェクト | 更新 | projectID |
    | addGroupsToProject | プロジェクト | addGroup | projectID |
    | removeGroupsFromProject | プロジェクト | removeGroup | projectID |
    | addTask | タスク | 追加:本番 | projectID |
    | taskDrushUserLogin | タスク | drushUserLogin:destination:本番 | environmentID |
    | taskDrushSql Sync | タスク | drushSqlSync:destination:production | プロジェクトID |
    | taskDrushRsyncFiles | タスク | drushRsync:destination:production | プロジェクトID |
    | addBackup | バックアップ | 追加 | プロジェクトID |
    | getBackupsByEnvironmentId | バックアップ | 表示 | プロジェクトID |
    | addEnvVariable \(to Environment\) | env\_var | environment:add:development | プロジェクトID |
    | deleteEnvVariable \(from Environment\) | env\_var | environment:delete:development | プロジェクトID |
    | getEnvVarsByEnvironmentId | env\_var | environment:viewValue:development | プロジェクトID |
    | addOrUpdateEnvironment | 環境 | addOrUpdate:development | プロジェクトID |
    | updateEnvironment | 環境 | update:development | プロジェクトID |
    | deleteEnvironment | 環境 | delete:development | プロジェクトID |
    | addDeployment | 環境 | deploy:development | プロジェクトID |
    | setEnvironmentServices | 環境 | update:development | プロジェクトID |
    | deployEnvironmentLatest | 環境 | deploy:development | プロジェクトID |
    | deployEnvironmentBranch | 環境 | deploy:development | プロジェクトID |
    | deployEnvironmentPullrequest | 環境 | deploy:development | プロジェクトID |
    | deployEnvironmentPromote | 環境 | deploy:development | プロジェクトID | 環境 | deploy:development | projectID |
    | getNotificationsByProjectId | 通知 | 表示 | projectID |
    | addTask | タスク | add:development | projectID |
    | taskDrushArchiveDump | タスク | drushArchiveDump:development | projectID |
    | taskDrushArchiveDump | タスク | drushArchiveDump:production | projectID |
    | taskDrushSqlDump | タスク | drushSqlDump:development | projectID |
    | taskDrushSqlDump | タスク | drushSqlDump:production | projectID |
    | taskDrushUserLogin | タスク | drushUserLogin:destination:development | environmentID |
    | taskDrushSqlSync | タスク | drushSqlSync:source:development | projectID |
    | taskDrushSqlSync | タスク | drushSqlSync:source:production | projectID |
    | taskDrushSqlSync | タスク | drushSqlSync:destination:development | projectID |
    | taskDrushRsyncFiles | タスク | drushRsync:source:development | projectID |
    | taskDrushRsyncFiles | タスク | drushRsync:source:production | projectID |
    | taskDrushRsyncFiles | タスク | drushRsync:destination:development | projectID |
    | deleteTask | タスク | 削除 | projectID |
    | updateTask | タスク | 更新 | projectID |
    | uploadFilesForTask | タスク | 更新 | projectID |
    | 削除 FilesForTask | タスク | 削除 | projectID |
    | getBackupsByEnvironmentId | デプロイメント | 表示 | projectID |
    | getEnvironmentsByProjectId | 環境 | 表示 | projectID |
    | getEnvironmentServices<br />ByEnvironmentId | 環境 | 表示 | projectID |
    | getEnvVarsByEnvironmentId | env\_var | 環境:表示:開発 | projectID |
    | getEnvVarsByEnvironmentId | env\_var | 環境:表示:製品 | projectID |
    | getEnvVarsByProjectId | env\_var | プロジェクト:表示 | projectID |
    | addGroup | グループ | 追加 |  |
    | getOpenshiftByProjectId | openshift | 表示 | projectID |
    | addProject | プロジェクト | 追加 |  |
    | getProjectByEnvironmentId | プロジェクト | 表示 | projectID |
    | getProjectByGitUrl | プロジェクト | 表示 | projectID |
    | getProjectByName | プロジェクト | 表示 | projectID |
    | addRestore | リストア | 追加 | projectID |
    | updateRestore | リストア | 更新 | projectID |
    | taskDrushCacheClear | タスク | drushCacheClear:開発 | projectID |
    | taskDrushCacheClear | タスク | drushCacheClear:製品 | projectID |
    | taskDrushCron | タスク | drushCron:開発 | projectID |
    | taskDrushCron | タスク | drushCron:製品 | projectID |
    | getFilesByTaskId | タスク | ビュー | プロジェクトID |
    | getTasksByEnvironmentId | タスク | ビュー | プロジェクトID |
    | getTaskByRemoteId | タスク | ビュー | プロジェクトID |
    | getTaskById | タスク | ビュー | プロジェクトID |
    | addUser | ユーザー | 追加 |  |
    | getAllOrganizations | 組織 | 全て表示 |  |
    | addOrganization | 追加 | 全て表示 |  |
    | updateOrganization | 更新 | 全て表示 |  |
    | deleteOrganization | 削除 | 全て表示 |  |
    | getOrganizationById | 組織 | ビュー | 組織ID |
    | getProjectByEnvironmentId | 組織 | プロジェクト表示 | 組織ID |
    | getGroupsByOrganizationId | 組織 | グループ表示 | 組織ID |
    | getUsersByOrganizationId | 組織 | ユーザー表示 | 組織ID |
    | getUserByEmailAndOrganizationId | 組織 | ユーザー表示 | 組織ID |
    | getNotificationsByOrganizationId | 組織 | 通知表示 | 組織ID |
    | addProject | 組織 | プロジェクト追加 | 組織ID |
    | updateProject | 組織 | プロジェクト更新 | 組織ID |
    | deleteProject | 組織 | プロジェクト削除 | 組織ID |
    | addGroup | 組織 | グループ追加 | 組織ID |
    | deleteGroup | 組織 | グループを削除 | 組織ID |
    | Slack通知を追加 | 組織 | 通知を追加 | 組織ID |
    | Slack通知を更新 | 組織 | 通知を更新 | 組織ID |
    | Slack通知を削除 | 組織 | 通知を削除 | 組織ID |
    | ユーザーを組織に追加 | 組織 | オーナーを追加 | 組織ID |
    | ユーザーを組織に追加 | 組織 | ビューワーを追加 | 組織ID |
    | 組織を更新 | 組織 | 組織を更新 | 組織ID |

=== "プラットフォーム全体の管理者"

    | **名前** | **リソース** | **スコープ** | **属性** |
    | :--- | :--- | :--- | :--- |
    | すべてのバックアップを削除 | バックアップ | すべて削除 |  |
    | すべての環境を削除 | 環境 | すべて削除 |  |
    | 環境IDによる月別環境ストレージを取得 | 環境 | ストレージ |  |
    | 環境IDによる月別環境時間を取得 | 環境 | ストレージ |  |
    | 環境IDによる月別環境ヒットを取得 | 環境 | ストレージ |  |
    | すべてのグループを削除 | グループ | すべて削除 |  |
    | すべてのSlack通知を削除 | 通知 | すべて削除 |  |
    | すべてのプロジェクトからすべての通知を削除 | 通知 | すべて削除 |  | 全てのOpenshiftsを取得 | openshift | 全部見る |  |
    | 全プロジェクトを削除 | project | 全部削除 |  |
    | 全Sshキーを削除 | ssh\_key | 全部削除 |  |
    | 全ユーザーから全Sshキーを削除 | ssh\_key | 全部削除 |  |
    | 全ユーザーを削除 | user | 全部削除 |  |
    | 環境ストレージを追加または更新<br /> | environment | storage |  |
    | Slack通知を追加 | notification | 追加 |  |
    | Slack通知を更新 | notification | 更新 |  |
    | Slack通知を削除 | notification | 削除 |  |
    | Kubernetesを追加 | kubernetes | 追加 |  |
    | Kubernetesを更新 | kubernetes | 更新 |  |
    | Kubernetesを削除 | kubernetes | 削除 |  |
    | 全Kubernetesを削除| kubernetes | 全部削除 |  |
    | 全プロジェクトを取得 | project | 全部見る |  |
    | Sshキーを追加 | ssh\_key | 追加 | userID |
    | Sshキーを更新 | ssh\_key | 更新 | userID |
    | Sshキーを削除 | ssh\_key | 削除 | userID |
    | ユーザーのSshキーを取得 | ssh\_key | ユーザー表示 | userID |
    | ユーザーを更新 | user | 更新 | userID |
    | ユーザーを削除 | user | 削除 | userID |
    | 環境を削除 | environment | production削除 | projectID |
    | プロジェクトを削除 | project | 削除 | projectID |
    | 環境IDによるプロジェクト取得 | project | 私の鍵を見る | プロジェクトID |
    | getProjectByGitUrl | プロジェクト | 私の鍵を見る | プロジェクトID |
    | getProjectByName | プロジェクト | 私の鍵を見る | プロジェクトID |
    | deleteBackup | バックアップ | 削除 | プロジェクトID |
    | addEnvVariable（プロジェクトに） | env_var | プロジェクト：追加 | プロジェクトID |
    | addEnvVariable（<br />環境に） | env_var | 環境：追加：プロダクション | プロジェクトID |
    | deleteEnvVariable | env_var | 削除 | プロジェクトID ||
    | deleteEnvVariable（プロジェクトから） | env_var | プロジェクト：削除 | プロジェクトID |
    | deleteEnvVariable（環境から） | env_var | 環境：削除：プロダクション | プロジェクトID |
    | getEnvVarsByProjectId | env_var | プロジェクト：値を見る | プロジェクトID |
    | getEnvVarsByEnvironmentId | env_var | 環境：値を見る：プロダクション | プロジェクトID |
    | addOrUpdateEnvironment | 環境 | 追加または更新：プロダクション | プロジェクトID |
    | updateEnvironment | 環境 | 更新：プロダクション | プロジェクトID |
    | addDeployment | 環境 | デプロイ：プロダクション | プロジェクトID |
    | deleteDeployment | デプロイメント | 削除 | プロジェクトID |
    | updateDeployment | デプロイメント | 更新 | プロジェクトID |
    | setEnvironmentServices | 環境 | 更新：プロダクション | projectID |
    | deployEnvironmentLatest | 環境 | deploy:production | projectID |
    | deployEnvironmentBranch | 環境 | deploy:production | projectID |
    | deployEnvironmentPullrequest | 環境 | deploy:production | projectID |
    | deployEnvironmentPromote | 環境 | deploy:production | projectID |
    | updateGroup | グループ | 更新 | groupID |
    | deleteGroup | グループ | 削除 | groupID |
    | addUserToGroup | グループ | addUser | groupID |
    | removeUserFromGroup | グループ | removeUser | groupID |
    | addNotificationToProject | プロジェクト | addNotification | projectID |
    | removeNotificationFromProject | プロジェクト | removeNotification | projectID |
    | updateProject | プロジェクト | 更新 | projectID |
    | addGroupsToProject | プロジェクト | addGroup | projectID |
    | removeGroupsFromProject | プロジェクト | removeGroup | projectID |
    | addTask | タスク | add:production | projectID |
    | taskDrushUserLogin | タスク | drushUserLogin:destination:production | environmentID |
    | taskDrushSqlSync | タスク | drushSqlSync:destination:production | projectID |
    | taskDrushRsyncFiles | タスク | drushRsync:destination:production | projectID |
    | addBackup | バックアップ | 追加 | プロジェクトID |
    | getBackupsByEnvironmentIdによるバックアップ | バックアップ | 見る | プロジェクトID |
    | addEnvVariable \(環境に\) | env\_var | environment:add:development | プロジェクトID |
    | deleteEnvVariable \(環境から\) | env\_var | environment:delete:development | プロジェクトID |
    | getEnvVarsByEnvironmentIdによるenv_var | env\_var | environment:viewValue:development | プロジェクトID |
    | 環境の追加または更新 | 環境 | addOrUpdate:development | プロジェクトID |
    | 環境の更新 | 環境 | update:development | プロジェクトID |
    | 環境の削除 | 環境 | delete:development | プロジェクトID |
    | デプロイメントの追加 | 環境 | deploy:development | プロジェクトID |
    | setEnvironmentServicesによる環境 | 環境 | update:development | プロジェクトID |
    | deployEnvironmentLatestによる環境 | 環境 | deploy:development | プロジェクトID |
    | deployEnvironmentBranchによる環境 | 環境 | deploy:development | プロジェクトID |
    | deployEnvironmentPullrequestによる環境 | 環境 | deploy:development | プロジェクトID |
    | deployEnvironmentPromoteによる環境 | 環境 | deploy:development | プロジェクトID |
    | getNotificationsByProjectIdによる通知 | 通知 | 見る | プロジェクトID |
    | タスクの追加 | タスク | add:development | プロジェクトID | projectID |
    | taskDrushArchiveDump | タスク | drushArchiveDump:development | projectID |
    | taskDrushArchiveDump | タスク | drushArchiveDump:production | projectID |
    | taskDrushSqlDump | タスク | drushSqlDump:development | projectID |
    | taskDrushSqlDump | タスク | drushSqlDump:production | projectID |
    | taskDrushUserLogin | タスク | drushUserLogin:destination:development | environmentID |
    | taskDrushSqlSync | タスク | drushSqlSync:source:development | projectID |
    | taskDrushSqlSync | タスク | drushSqlSync:source:production | projectID |
    | taskDrushSqlSync | タスク | drushSqlSync:destination:development | projectID |
    | taskDrushRsyncFiles | タスク | drushRsync:source:development | projectID |
    | taskDrushRsyncFiles | タスク | drushRsync:source:production | projectID |
    | taskDrushRsyncFiles | タスク | drushRsync:destination:development | projectID |
    | deleteTask | タスク | 削除 | projectID |
    | updateTask | タスク | 更新 | projectID |
    | uploadFilesForTask | タスク | 更新 | projectID |
    | deleteFilesForTask | タスク | 削除 | projectID |
    | getBackupsByEnvironmentId | デプロイメント | ビュー | projectID |
    | getEnvironmentsByProjectId | 環境 | | 表示 | プロジェクトID |
    | getEnvironmentServices<br />ByEnvironmentId | 環境 | 表示 | プロジェクトID |
    | getEnvVarsByEnvironmentId | env\_var | environment:view:development | プロジェクトID |
    | getEnvVarsByEnvironmentId | env\_var | environment:view:production | プロジェクトID |
    | getEnvVarsByProjectId | env\_var | project:view | プロジェクトID |
    | addGroup | group | 追加 |  |
    | getOpenshiftByProjectId | openshift | 表示 | プロジェクトID |
    | addProject | project | 追加 |  |
    | getProjectByEnvironmentId | project | 表示 | プロジェクトID |
    | getProjectByGitUrl | project | 表示 | プロジェクトID |
    | getProjectByName | project | 表示 | プロジェクトID |
    | addRestore | restore | 追加 | プロジェクトID |
    | updateRestore | restore | 更新 | プロジェクトID |
    | taskDrushCacheClear | task | drushCacheClear:development | プロジェクトID |
    | taskDrushCacheClear | task | drushCacheClear:production | プロジェクトID |
    | taskDrushCron | task | drushCron:development | プロジェクトID |
    | taskDrushCron | task | drushCron:production | プロジェクトID |
    | getFilesByTaskId | task | 表示 | プロジェクトID |
    | getTasksByEnvironmentId | task | 表示 | プロジェクトID |
    | getTaskByRemoteId | task | 表示 | プロジェクトID |     | getTaskById | タスク | ビュー | プロジェクトID |
    | addUser | ユーザー | 追加 |  |
    | getAllOrganizations | 組織 | すべて表示 |  |
    | addOrganization | 追加 | すべて表示 |  |
    | updateOrganization | 更新 | すべて表示 |  |
    | deleteOrganization | 削除 | すべて表示 |  |
    | getOrganizationById | 組織 | ビュー | 組織ID |
    | getProjectByEnvironmentId | 組織 | プロジェクト表示 | 組織ID |
    | getGroupsByOrganizationId | 組織 | グループ表示 | 組織ID |
    | getUsersByOrganizationId | 組織 | ユーザー表示 | 組織ID |
    | getUserByEmailAndOrganizationId | 組織 | ユーザー表示 | 組織ID |
    | getNotificationsByOrganizationId | 組織 | 通知表示 | 組織ID |
    | addProject | 組織 | プロジェクト追加 | 組織ID |
    | updateProject | 組織 | プロジェクト更新 | 組織ID |
    | deleteProject | 組織 | プロジェクト削除 | 組織ID |
    | addGroup | 組織 | グループ追加 | 組織ID |
    | deleteGroup | 組織 | グループ削除 | 組織ID |
    | addNotificationSlack | 組織 | 通知追加 | 組織ID |
    | updateNotificationSlack | 組織 | updateNotification | 組織Id |
    | deleteNotificationSlack | 組織 | removeNotification | 組織Id |
    | addUserToOrganization | 組織 | addOwner | 組織Id |
    | addUserToOrganization | 組織 | addViewer | 組織Id |
    | updateOrganization | 組織 | updateOrganization | 組織Id |
