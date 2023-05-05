# Private Repositories

1. Give the deploy key access to the Git repositories in your GitHub/GitLab/BitBucket.
2. Add `ARG LAGOON_SSH_PRIVATE_KEY` to your `dockerfile` \(before the step of the build process that needs the SSH key\).
3. Add `RUN /lagoon/entrypoints/05-ssh-key.sh` to your `dockerfile` \(before the step of the build process that needs the SSH key\).

```bash title="Set up your private respository"
RUN /lagoon/entrypoints/05-ssh-key.sh && composer install && rm /home/.ssh/key
```