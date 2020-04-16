# Kubernetes Deploy Queue

This service is called `kubernetesdeployqueue`, it is part of the Lagoon deployment system and is resposnsible for queueing build jobs from the rabbitmq queue `lagoon-tasks-monitor:queuedeploy-kubernetes` before sending them to `kubernetesbuilddeploy` to be deployed.