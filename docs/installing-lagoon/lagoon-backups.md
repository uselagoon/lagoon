# Lagoon Backups

Lagoon uses the K8up backup operator: [https://k8up.io](https://k8up.io). Lagoon isn’t tightly integrated with K8up, it’s more that Lagoon can create its resources in a way that K8up can automatically discover and backup.

Lagoon has been extensively tested with K8up 1.x, but is not compatible with 2.x yet. We recommend using the 1.1.0 chart version (App version v1.2.0).

1. Create new AWS User with policies:

    ```json title="example K8up IAM user"
    {
      "Version":"2012-10-17",
      "Statement":[
        {
          "Sid":"VisualEditor0",
          "Effect":"Allow",
          "Action":[
            "s3:ListAllMyBuckets",
            "s3:CreateBucket",
            "s3:GetBucketLocation"
          ],
          "Resource":"*"
        },
        {
          "Sid":"VisualEditor1",
          "Effect":"Allow",
          "Action":"s3:ListBucket",
          "Resource":"arn:aws:s3:::baas-*"
        },
        {
          "Sid":"VisualEditor2",
          "Effect":"Allow",
          "Action":[
            "s3:PutObject",
            "s3:GetObject",
            "s3:AbortMultipartUpload",
            "s3:DeleteObject",
            "s3:ListMultipartUploadParts"
          ],
          "Resource":"arn:aws:s3:::baas-*/*"
        }
      ]
    }
    ```

2. Create `k8up-values.yml` (customize for your provider):

    ```yaml title="k8up-values.yml"
    k8up:
      envVars:
        - name: BACKUP_GLOBALS3ENDPOINT
          value: 'https://s3.eu-west-1.amazonaws.com'
        - name: BACKUP_GLOBALS3BUCKET
          value: ''
        - name: BACKUP_GLOBALKEEPJOBS
          value: '1'
        - name: BACKUP_GLOBALSTATSURL
          value: 'https://backup.lagoon.example.com'
        - name: BACKUP_GLOBALACCESSKEYID
          value: ''
        - name: BACKUP_GLOBALSECRETACCESSKEY
          value: ''
        - name: BACKUP_BACKOFFLIMIT
          value: '2'
        - name: BACKUP_GLOBALRESTORES3BUCKET
          value: ''
        - name: BACKUP_GLOBALRESTORES3ENDPOINT
          value: 'https://s3.eu-west-1.amazonaws.com'
        - name: BACKUP_GLOBALRESTORES3ACCESSKEYID
          value: ''
        - name: BACKUP_GLOBALRESTORES3SECRETACCESSKEY
          value: ''
      timezone: Europe/Zurich
    ```

3. Install K8up:

    ```bash title="Install K8up Step 1"
    helm repo add appuio https://charts.appuio.ch
    ```

    ```bash title="Install K8up Step 2"
    kubectl apply -f https://github.com/vshn/k8up/releases/download/v1.2.0/k8up-crd.yaml
    ```

    ```bash title="Install K8up Step 3"
    helm upgrade --install --create-namespace \
      --namespace k8up \
      -f k8up-values.yaml \
      --version 1.1.0 \
      k8up appuio/k8up
    ```

4. Update `lagoon-core-values.yml`:

   ```yaml title="lagoon-core-values.yml"
   s3BAASAccessKeyID: <<Access Key ID for restore bucket>>
   s3BAASSecretAccessKey: <<Access Key Secret for restore bucket>>
   ```

5. Redeploy `lagoon-core`.
