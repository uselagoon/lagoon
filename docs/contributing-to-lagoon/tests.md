# Tests

All of our tests are written with [Ansible](https://docs.ansible.com/ansible/latest/index.html) and mostly follow this approach:

1. They create a new Git repository.
2. Add and commit some files from a list of files \(in `tests/files`\) into this Git repository.
3. Push this Git repository to a Git server \(either locally or on GitHub\).
4. Send a trigger to a trigger service \(for example a webhook to the webhook handler, which is the same as a real webhook that would be sent\).
5. Starts to monitor the URL at which the test would expect something to happen \(like deploying a Node.js app that has the Git branch as an HTML text\).
6. Compares the result on the URL with the expected result.

Lagoon is mostly tested in 3 different ways:

## 1. Locally

During local development, the best way to test is locally. All tests are started via `make`. Make will download and build all the required dependencies.

```bash title="Make tests"
make tests
```

This will run all defined tests. If you only want to run a subset of the tests, run `make tests-list` to see all existing tests and run them individually.

For example, `make tests/node` will run the Node.js Docker images tests.

In order to actually see what is happening inside the microservices, we can use `make logs`:

```bash title="Make logs"
make logs
```

Or only for a specific service:

```bash title="Make logs"
make logs service=webhook-handler
```

## 2. Automated integration testing

In order to test pull requests that are created against Lagoon, we have a fully automatic integration test running on a dedicated Jenkins instance: [https://ci.lagoon.sh](https://ci.lagoon.sh). It is defined inside the `.Jenkinsfile`, and runs automatically for every pull request that is opened.

This will build all images, start a Kubernetes cluster and run a series of tests.

The tests can be found here:

<!-- markdown-link-check-disable -->
* [https://ci.lagoon.sh/blue/organizations/jenkins/lagoon/activity](https://ci.lagoon.sh/blue/organizations/jenkins/lagoon/activity)
<!-- markdown-link-check-enable -->
