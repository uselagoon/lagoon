# OpenShift Build Deploy

This service is called `openshiftbuilddeploy`, it is part of the Lagoon deployment system and is resposnsible for deploying OpenShift resources for each task in the rabbitmq queue `lagoon-tasks:builddeploy-openshift`

Its primary role is to create the project(namespace), and any builds inside that project on OpenShift.