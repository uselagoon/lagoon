# Lagoonビルドのエラーと警告

新しいバージョンのLagoonでは、ビルドに潜在的な問題があるかどうかを識別し、失敗せずにそれらを警告としてハイライトする機能があります。これはまた、Lagoonチームがユーザーに対して予定されている非推奨や機能の変更を通知する方法でもあります。

例えば、Lagoonチームが `lagoon.yml` の設定を変更し、ユーザーが変更する必要がある何かがあった場合、警告にそれが記されます。そこでユーザーは、それが破壊的な変更になる前に変更することができます。可能な限り早期に解決するべきであり、将来のLagoonのリリースではエラーを処理できないかもしれませんが、ビルドを停止させるべきではありません。

これらのエラーの解決方法がわからない場合は、Lagoonの管理者に連絡するか、[Lagoonコミュニティ](../community/discord.md)で質問してください。

## Docker Composeのエラー { #docker-compose-errors }

[一般的なDocker Composeの問題](../concepts-basics/docker-compose-yml.md#common-docker-compose-issues)についてのセクションも参照してください。これらの問題の一部はそこでカバーされているかもしれません。

``` shell title="env_file エラーを示す Lagoon ビルド出力"
> an env_file is defined in your docker-compose file, but no matching file found
```

Docker Compose ビルド時に参照されるenvファイルが存在することを期待していますが、そのenvファイルはローカル開発環境でのみ存在するか、Dockerfileから除外されています。Lagoonチームは、Docker Composeがこのエラーを無視することを可能にするための作業を行っていますので、解決策が見つかるまでこの警告は続きます。

``` shell title="文字列キーエラーを示すLagoonビルド出力"
> an invalid string key was detected in your docker-compose file
```

あなたのDocker Composeファイルにエラーがあります、おそらく形式が不正またはエイリアスやアンカーの誤用に関連している可能性があります。エラーメッセージはあなたがどこで理解するのを助けるべきです。

``` shell title="yaml検証エラーを示すLagoonビルド出力"
> There are yaml validation errors in your docker-compose file that should be corrected
```

あなたのDocker Composeファイルにエラーがあります、おそらく形式が不正またはエイリアスやアンカーの誤用に関連している可能性があります。エラーメッセージはあなたがどこで理解するのを助けるべきです。
