<p align="center"><img
src="https://raw.githubusercontent.com/amazeeio/lagoon/master/docs/images/lagoon-logo.png"
alt="The Lagoon logo is a blue hexagon split in two pieces with an L-shaped cut"
width="40%"></p>

This service is part of amazee.io Lagoon, a Docker build and deploy system for
OpenShift & Kubernetes. Please reference our [documentation] for detailed
information on using, developing, and administering Lagoon.

# Kubernetes Build & Deploy Queue (`kubernetesdeployqueue`)

Processes the queue of build/deploy requests for Lagoon project environments
running in a Kubernetes cluster. [Kubernetes jobs] are the mechanism used for
building and deploying new/existing Lagoon project environments. The queue is
used to ensure that Kubernetes jobs are run in sequence per namespace. The job
is created in Kubernetes and then the Kubernetes Build & Deploy Monitor
service takes over.

Some errors that can occur during the processing are tolerable and/or expected
in which case the request will be requeued and retried after some delay.

## Technology

* Node
* Message Queue

## Related Services

* API [***dependency***]
* RabbitMQ [***dependency***]
* kubernetesbuilddeploy [***related***]
* kubernetesbuilddeploymonitor [***related***]

## Message Queues

* Consumes: `lagoon-tasks-monitor:queuedeploy-kubernetes`
* Produces: `lagoon-tasks-monitor:builddeploy-kubernetes`, `lagoon-tasks-monitor-delay`

[documentation]: https://lagoon.readthedocs.io/
[Kubernetes jobs]: https://kubernetes.io/docs/concepts/workloads/controllers/job/
