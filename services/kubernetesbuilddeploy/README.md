# Kubernetes Build Deploy

This service is called `kubernetesbuilddeploy`, it is part of the Lagoon deployment system and is resposnsible for deploying Kubernetes resources for each task in the rabbitmq queue `lagoon-tasks:builddeploy-kubernetes`

Its primary role is to create the namespace), and any build jobs inside that namespace on Kubernetes.