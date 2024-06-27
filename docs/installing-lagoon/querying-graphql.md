# Querying with GraphQL

1. You’ll need an app for sending and receiving GraphQL queries. We recommend GraphiQL.

  1. If you’re using Homebrew, you can install it with `brew install --cask graphiql`.

2. We need to tell Lagoon Core about the Kubernetes cluster. The GraphQL endpoint is: `https://<YOUR-API-URL>/graphql`
3. Go to **Edit HTTP Headers**, and **Add Header**.

  1. Header Name: `Authorization`
  2. Value: `Bearer YOUR-TOKEN-HERE`
  3. In your home directory, the Lagoon CLI has created a `.lagoon.yml` file. Copy the token from that file and use it for the value here.
  4. Save.

4. Now you’re ready to run some queries. Run the following test query to ensure everything is working correctly:

    ```graph title="Get all projects"
    query allProjects {allProjects {name } }
    ```

5. This should give you the following response:

  ```graph title="API Response"
    {
      "data": {
        "allProjects": []
      }
    }
  ```

  [Read more about GraphQL here in our documentation.](../interacting/graphql.md)

6. Once you get the correct response, we need to add a mutation.

  1. Run the following query:

    ```graphql title="Add mutation"
    mutation addKubernetes {
      addKubernetes(input:
      {
        name: "<TARGET-NAME-FROM-REMOTE-VALUES.yml>",
        consoleUrl: "<URL-OF-K8S-CLUSTER>",
        token: "xxxxxx”
        routerPattern: "${environment}.${project}.lagoon.example.com"
      }){id}
    }
    ```

    1. `name`: get from `lagoon-remote-values.yml`
    2. `consoleUrl`: API Endpoint of Kubernetes cluster. Get from `values.yml`
    3. `token`: get a token for the `ssh-core` service account

      ```bash title="Get token"
      kubectl -n lagoon get secret/lagoon-remote-ssh-core-token -o json | jq -r '.data.token | @base64d'
      ```

!!! Info
    Authorization tokens for GraphQL are very short term so you may need to generate a new one. Run `lagoon login` and then cat the `.lagoon.yml` file to get the new token, and replace the old token in the HTTP header with the new one.
