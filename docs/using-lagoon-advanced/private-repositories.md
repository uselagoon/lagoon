---
description: Using private Bitbucket or Git repositories with Lagoon
---

# Private Repositories

1. Give the deploy key access to the git repositories in your Bitbucket/GitHub.
2. Add `ARG LAGOON_SSH_PRIVATE_KEY` to your `dockerfile` \(before the step of the build process that needs the SSH key\).
3. add `RUN /lagoon/entrypoints/05-ssh-key.sh` to your `dockerfile` \(before the step of the build process that needs the SSH key\).

`RUN /lagoon/entrypoints/05-ssh-key.sh && composer install && rm /home/.ssh/key`

