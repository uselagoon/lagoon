# lagoon-openshiftremove

This service is called 'openShiftRemove', is part of the amazee.io lagoon deployment system and is responsible for removing OpenShift Resources for each task in the rabbitmq queue `lagoon-tasks:remove-openshift-resources`

It does the following:
1. read message from a rabbitmq queue called `lagoon-tasks:remove-openshift-resources`, which have the following information:

- `projectName` (name of the project that should be handled)
- `openshiftRessourceAppName` (name of resource in openshift that should be removed, it use them as an openshift label with the key `app`)
- `openshiftProject` (name of the openshift project that should be removed)

2. connect to the lagoon api and load additional openshift information (token and the console url) for the given project
3. create a new jenkinsjob which runs `oc delete all -l app={openshiftRessourceAppName}` against the found OpenShift console

It logs the start, success and error of the jenkins jobs into lagoon-logs.

It uses https://github.com/benbria/node-amqp-connection-manager for connecting to rabbitmq, so it can handle situations were rabbitmq is not reachable and still receive webhooks, process them and keep them in memory. As soon as rabbitmq is reachable again, it will send the messages there.

## Hosting

Fully developed in Docker and hosted on amazee.io Openshift, see the `.openshift` folder. Deployed via Jenkinsfile.

Uses `lagoon/node:10` as base image.

## Development

Via the existing docker-compose.yml (see the file for defining the Api, Jenkins and RabbitMQ Host to be used)

        docker-compose up -d
