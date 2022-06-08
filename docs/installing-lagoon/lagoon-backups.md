# Lagoon Backups

Lagoon uses the k8up backup operator: [https://k8up.io](https://k8up.io). Lagoon isn’t tightly integrated with k8up, it’s more that Lagoon can create its resources in a way that k8up can automatically discover and backup.

1. Create new AWS User with policies: [https://gist.github.com/Schnitzel/1ad9761042c388a523029a2b4ff9ed75](https://gist.github.com/Schnitzel/1ad9761042c388a523029a2b4ff9ed75)
2. Create `k8up-values.yaml`.\
   See gist example: [https://gist.github.com/Schnitzel/5b87a9e9ee7c59b2bc6b29f0f0839d56](https://gist.github.com/Schnitzel/5b87a9e9ee7c59b2bc6b29f0f0839d56)
3. Install k8up:

    `helm repo add appuio https://charts.appuio.ch`

    `kubectl apply -f https://github.com/vshn/k8up/releases/download/v1.1.0/k8up-crd.yaml`

    `helm upgrade --install --create-namespace --namespace k8up -f k8up-values.yaml k8up appuio/k8up`

4. Update `lagoon-core-values.yaml`:

      ```yaml title="lagoon-core-values.yaml"
      s3BAASAccessKeyID: <<Access Key ID for restore bucket>>
      s3BAASSecretAccessKey: <<Access Key Secret for restore bucket>>
      ```

5. Redeploy `lagoon-core`.
