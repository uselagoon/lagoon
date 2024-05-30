# tasks-activestandby

This image is used by the activestandby task. The remote-controller has knowledge of this task and will create a role binding between the two namespaces to allow them to temporarily talk and create/edit/delete resources between them as part of the task process.

The resulting payload contains information about the actions that were performed, which are sent back to Lagoon via the message queue to be reflected in the API.

The basic idea is that when activestandby is triggered, it collects the ingress in both namespaces that match the labels `dioscuri.amazee.io/migrate=true` and `activestandby.lagoon.sh/migrate=true` and will then perform the action of storing information about them, removing them from the source namespace, and then creating them in the destination namespace.

Part of this process also involves copying secrets and certificates if they are present, so that they are also available in the destination namespace.

When the process of migrating is taking place, all ingress have a new label added which is `activestandby.lagoon.sh/migrating=true`, which at the end of the migration process is set to `false`. This label will only be true while migrations are taking place. This allows external systems to be aware of the migration if they need to take any action, or prevent some actions from taking place.