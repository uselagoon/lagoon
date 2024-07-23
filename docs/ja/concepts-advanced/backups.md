# バックアップ

Lagoonは、データベースのデータとコンテナの永続的なストレージボリュームの両方のバックアップ機能を提供するために、[k8up operator](https://github.com/vshn/k8up)を使用しています。このオペレータは、これらのバックアップをカタログ化するために[Restic](https://github.com/restic/restic)を利用し、通常はAWS S3バケットに接続して生成されたバックアップの安全なオフサイトストレージを提供します。

## production環境

### バックアップスケジュール

データベースとコンテナの永続的なストレージボリュームのバックアップは、デフォルトで`production`環境内で夜間に行われます。

バックアップに異なるスケジュールが必要な場合はプロジェクトの[.lagoon.yml](../concepts-basics/lagoon-yml.md#backup-schedule)ファイルの"Backup Schedule"変数を設定することでプロジェクトレベルで指定できます。

### バックアップ保持

production環境のバックアップは、デフォルトで以下のスケジュールに従って保持されます:

* 日次:7
* 週次:6
* 月次:1
* 時間ごと:0

バックアップに異なる保持期間が必要な場合はプロジェクトの[.lagoon.yml](../concepts-basics/lagoon-yml.md#backup-retention)ファイルにある"Backup Retention"変数を設定することでプロジェクトレベルで指定できます。

## 開発環境

開発環境のバックアップは毎晩試みられますが、あくまでベストエフォートサービスです。

## バックアップの取得

Resticに保存されたバックアップはLagoon内で追跡され、Lagoon UIの各環境の「バックアップ」タブから回復することができます。

## カスタムバックアップおよび/またはリストア位置

Lagoonは、各プロジェクトのLagoon APIに保存されている"[カスタムバックアップ設定](../concepts-advanced/environment-variables.md#custom-backup-settings)"および/または"[カスタムリストア設定](../concepts-advanced/environment-variables.md#custom-restore-location)"変数を使用して、カスタムバックアップとリストアの場所をサポートします。

!!! Danger "危険"
    注意して進めてください:これらの変数を設定すると、クラスターレベルで設定されている可能性のあるバックアップ/リストアのストレージ場所が上書きされます。設定が間違っていると、バックアップ/リストアが失敗する原因となります。
