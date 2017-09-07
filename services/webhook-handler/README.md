# amazeeio-webhook-handler

This webhook handler is part of the amazee.io lagoon deployment system and is responsible for receiving webhooks from github, bitbucket, gitlab or any other system, parse them and add them in a unified format (as each of the different git hosters have different webhook formats) to a rabbitmq queue. For each webhook the following information are extracted:

- `webhooktype` (`github`, `gitlab`, etc.)
- `event` (event type, like `push` `pull_request`, specific for each webhook type)
- `giturl` (URL of the git repo)
- `body` (full body of webhook payload)

It uses https://github.com/benbria/node-amqp-connection-manager for connecting to rabbitmq, so it can handle situations were rabbitmq is not reachable and still receive webhooks, process them and keep them in memory. As soon as rabbitmq is rechable again, it will send the messages there.

Logs each received webhook to the amazeeio-logs queue.

## Hosting

Fully developed in Docker and hosted on amazee.io Openshift, see the `.openshift` folder. Deployed via Jenkinsfile.

Uses `amazeeio/centos7-node8` as base image.

## Development

Can be used with a local nodejs and connect to a rabbitmq of your choice.

        yarn install
        RABBITMQ_HOST=guest:guest@rabbitmqhost yarn run start

Or via the existing docker-compose.yml

        docker-compose up -d

## Testdata

There is testdata available from Postman. In order to use it, download [Postman](https://www.getpostman.com/) and import the `amazeeio-webhook-handler.postman_collection.json` as collection, plus the `localhost.postman_environment.json` as environment.
Now you can send single requests to the webhook handler.

You can also run all tests from the CLI via newman

        yarn run newman-runall
