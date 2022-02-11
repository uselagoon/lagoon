# Lagoon Insights Handler

This service will listen for deployment events and handle the requirements of the payload.

## Facts
Currently, the main purpose is to consume Software Bill of Materials (SBOM) facts from the Lagoon logs queue, process
and push to the api.


## Testing locally

    go run main.go \
        -rabbitmq-username guest \
        -rabbitmq-password guest \
        -lagoon-api-host http://localhost:3000/graphql \
        --access-key-id minio \
        --secret-access-key minio123

To compile GraphQL schema, type-safe structs and response data with genqlient we just add a query/mutation inside of `lagoonclient/genqlient.graphql` and run this:

    go generate

    
    