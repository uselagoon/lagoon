# Lagoon Files

Lagoon files are used to store the file output of tasks, such as backups, and can be hosted on any S3-compatible storage.

1. Create new AWS User with policies** - **see example gist: [https://gist.github.com/Schnitzel/d3fa4353cb083831207494bfe1ff0151](https://gist.github.com/Schnitzel/d3fa4353cb083831207494bfe1ff0151)
2. Update `lagoon-core-values.yaml`:

      ```yaml title="lagoon-core-values.yaml"
      s3FilesAccessKeyID: <<Access Key ID>>
      s3FilesBucket: <<Bucket Name for Lagoon Files>>
      s3FilesHost: <<S3 endpoint like "https://s3.eu-west-1.amazonaws.com" >>
      s3FilesSecretAccessKey: <<Access Key Secret>>
      s3FilesRegion: <<S3 Region >>
      ```

3. If you use `ingress-nginx` in front of `lagoon-core`, we suggest setting this configuration which will allow for bigger file uploads:

      ```yaml title="lagoon-core-values.yaml"
      controller:
      config:
         client-body-timeout: '600' # max 600 secs fileuploads
         proxy-send-timeout: '1800' # max 30min connections - needed for websockets
         proxy-read-timeout: '1800' # max 30min connections - needed for websockets
         proxy-body-size: 1024m # 1GB file size
         proxy-buffer-size: 64k # bigger buffer
      ```
