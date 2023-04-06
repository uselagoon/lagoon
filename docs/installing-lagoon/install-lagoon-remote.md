# Install Lagoon Remote

Now we will install Lagoon Remote into the Lagoon namespace. The [RabbitMQ](../docker-images/rabbitmq.md) service is the broker.

1. Create `lagoon-remote-values.yml` in your config directory as you did the previous two files, and update the values.

  * **rabbitMQPassword**

  ``` bash title="Get RabbitMQ password"
  kubectl -n lagoon-core get secret lagoon-core-broker -o jsonpath="{.data.RABBITMQ_PASSWORD}" | base64 --decode
  ```

  * **rabbitMQHostname**

  ```bash title="lagoon-remote-values.yml"
  lagoon-core-broker.lagoon-core.svc.local
  ```

  * **taskSSHHost**

  ```bash title="Update SSH Host"
  kubectl get service lagoon-core-broker-amqp-ext \
    -o custom-columns="NAME:.metadata.name,IP ADDRESS:.status.loadBalancer.ingress[*].ip,HOSTNAME:.status.loadBalancer.ingress[*].hostname"
  ```

  * **harbor-password**

  ```bash title="Get Harbor secret"
  kubectl -n harbor get secret harbor-harbor-core -o jsonpath="{.data.HARBOR_ADMIN_PASSWORD}" | base64 --decode
  ```

1. Add the Harbor configuration from the [Install Harbor](./install-harbor.md) step.

  ```yaml title="lagoon-remote-values.yml"
  lagoon-build-deploy:
    enabled: true
    extraArgs:
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

1. Install Lagoon Remote:

    ```bash title="Install Lagoon remote"
    helm upgrade --install --create-namespace \
      --namespace lagoon \
      -f remote-values.yaml \
      lagoon-remote lagoon/lagoon-remote
    ```
