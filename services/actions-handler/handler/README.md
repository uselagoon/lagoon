# actions-handler

Any messages that come in on a message queue are handled by this handler.

Messages can include:
* Triggering bulk deploy environment commands
* Updating environment storage from storage-calculator
* Updating deployments and environments from Lagoon builds
* Updating tasks from Lagoon tasks
* Removing environments from Lagoon when they are deleted in remotes

It listens to two queues
* lagoon-actions:items (for general inter core stuff, similar to webhooks2tasks)
* lagoon-tasks:controller (for handling messages received from the remote-controllers)