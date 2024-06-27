# Roles

_Roles_ determine a user's access to projects. Users are given roles in groups and organizations.

Members of groups can be given the following roles:

- Guest
- Reporter
- Developer
- Maintainer
- Owner

These roles and their permissions are described in more depth here: [Role-Based Access Control](../../interacting/rbac.md).

Members of organizations can be given the following roles:

- Org Owner
- Org Viewer

!!! info inline end "Changing Quotas"

    If you need to change quotas, please contact {{ defaults.helpstring }}.

An _organization owner_ can do everything to do with administering an organization aside from changing quotas. They can add and delete users, groups, projects, deploy targets, and notifcations

An _organization viewer_ is a read-only role that can only view the organization, but cannot make any changes or additions. They can view the projects, groups, users, and notifications within an organization but cannot modify them.

A user who has not been assigned as an owner or viewer cannot see the organization.
