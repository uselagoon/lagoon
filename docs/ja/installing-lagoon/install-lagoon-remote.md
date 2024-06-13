# Lagoon Remoteをインストール

次に、Lagoon RemoteをLagoon名前空間にインストールします。[RabbitMQ](../docker-images/rabbitmq.md)サービスがブローカーとなります。

1. 前の二つのファイルと同様に、設定ディレクトリに`lagoon-remote-values.yml`を作成し、値を更新します。

  * **rabbitMQPassword**

  ``` bash title="RabbitMQ passwordを取得"
  kubectl -n lagoon-core get secret lagoon-core-broker -o jsonpath="{.data.RABBITMQ_PASSWORD}" | base64 --decode
  ```

  * **rabbitMQHostname**

  ```bash title="lagoon-remote-values.yml"
  lagoon-core-broker.lagoon-core.svc.local
  ```

  * **taskSSHHost**

  ```bash title="SSH Hostを更新"
  kubectl get service lagoon-core-broker-amqp-ext \
    -o custom-columns="NAME:.metadata.name,IP ADDRESS:.status.loadBalancer.ingress[*].ip,HOSTNAME:.status.loadBalancer.ingress[*].hostname"
  ```

  * **harbor-password**

  ```bash title="Harbor secretを取得"
  kubectl -n harbor get secret harbor-harbor-core -o jsonpath="{.data.HARBOR_ADMIN_PASSWORD}" | base64 --decode
  ```

1. [Harborのインストール](./install-harbor.md)のステップからHarbor設定を追加します。

  ```yaml title="lagoon-remote-values.yml"
  lagoon-build-deploy:
    enabled: true
    extraArgs :
      - "--enable-harbor=true"
      - "--harbor-url=https://harbor.lagoon.example.com"
      - "--harbor-api=https://harbor.lagoon.example.com/api/"
      - "--harbor-username=admin"
      - "--harbor-password=<from harbor-harbor-core secret>"
    rabbitMQUsername: lagoon
    rabbitMQPassword: <from lagoon-core-broker secret>
    rabbitMQHostname: lagoon-core-broker.lagoon-core.svc.cluster.local
    lagoonTargetName: <name of lagoon remote, can be anything>
    taskSSHHost: <IP of ssh service loadbalancer>
    taskSSHPort: "22"
    taskAPIHost: "api.lagoon.example.com"
  dbaas-operator:
    enabled: true

    mariadbProviders:
      production:
        environment: production
        hostname: 172.17.0.1.nip.io
        readReplicaHostnames:
        - 172.17.0.1.nip.io
        password: password
        port: '3306'
        user: root

      development:
        environment: development
        hostname: 172.17.0.1.nip.io
        readReplicaHostnames:
        - 172.17.0.1.nip.io
        password: password
        port: '3306'
        user: root
  ```

1. [ssh-core service account](https://github.com/uselagoon/lagoon-charts/blob/main/charts/lagoon-remote/values.yaml#L116-L を有効にします。 125)

1. Lagoon Remoteをインストールする：

    ```bash title="Lagoon remoteをインストール"
    helm upgrade --install --create-namespace \
      --namespace lagoon \
      -f lagoon-remote-values.yml \
      lagoon-remote lagoon/lagoon-remote
    ```