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
    ```text
    query allProjects {allProjects {name } }
    ```

5. This should give you the following response:

    ```text
    {
      "data": {
        "allProjects": []
      }
    }
    ```

    [Read more about GraphQL here in our documentation.](../using-lagoon-advanced/graphql.md)

6. Once you get the correct response, we need to add a mutation.
   1. Run the following query:

      ```text
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

      1. consoleUrl: API Endpoint of Kubernetes Cluster
      2. token: create a token for the lagoon-build-deploy service account
        ```
        kubectl -n lagoon create token lagoon-build-deploy --duration 3h
        ```
!!! Warning "Prior to Kubernetes 1.21:"
      use the lagoon-build-deploy token installed by lagoon-remote
        ```
        kubectl -n lagoon describe secret \
          $(kubectl -n lagoon get secret | grep lagoon-build-deploy | awk '{print $1}') | grep token: | awk '{print $2}'
        ```

!!! Note "Note:"
    Note: Authorization tokens for GraphQL are very short term so you may need to generate a new one. Run `lagoon login` and then cat the `.lagoon.yml` file to get the new token, and replace the old token in the HTTP header with the new one.
