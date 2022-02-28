# Lagoon Insights Handler

This service will listen for messages and handle the requirements of the payload.

## Facts
Currently, the main purpose is to consume a Software Bill of Materials (SBOM) of facts from the logs queue, process
and push to the api and s3 bucket.


## Local development

    go run main.go \
        -rabbitmq-username guest \
        -rabbitmq-password guest \
        -lagoon-api-host http://localhost:7070/graphql \
        --jwt-token-signing-key secret  \
        --access-key-id minio \
        --secret-access-key minio123

To compile GraphQL schema, type-safe structs and response data with genqlient we just add a query/mutation inside of `lagoonclient/genqlient.graphql` and run this:

    go generate

    
    