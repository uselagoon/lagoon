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

```text
make tests
```

This will run all defined tests. If you only want to run a subset of the tests, run `make tests-list` to see all existing tests and run them individually.

For example, `make tests/node` will run the Node.js Docker images tests.

In order to actually see what is happening inside the microservices, we can use `make logs`:

```text
make logs
```

Or only for a specific service:

```text
make logs service=webhook-handler
```

Sometimes you will want to see what is happening inside of [Jenkins](https://jenkins.io/doc/). Your Jenkins instance can be found here:
<!-- markdown-link-check-disable-next-line -->
[http://localhost:8888/](http://localhost:8888/) \(`admin`:`admin`\)

Sometimes you just want to create another push webhook without having to wait for the Git repository to be initialized and pushed.

In this case, there is a small helper script, `tests/playbooks/helpers/just-push.yaml,` that will get the current HEAD of the Git repository and push a webhook push. It needs to know which Git repository and branch you would like to check and push:

```text
docker-compose -p lagoon exec tests ansible-playbook /ansible/tests/tests/helpers/just-push.yaml -e git_repo_name=node.git -e branch=develop
```

## 2. Automated integration testing

In order to test pull requests that are created against Lagoon, we have a fully automatic integration test running on [`TravisCI`](https://docs.travis-ci.com/): [https://travis-ci.org/amazeeio/lagoon](https://travis-ci.org/amazeeio/lagoon). It is defined inside the `.travis.yml` file, and runs automatically for every pull request that is opened.

This will build all images, start an OpenShift and run all tests.

The tests can be found here:

* `develop` branch: [https://lagoon-ci.amazeeio.cloud/blue/organizations/jenkins/lagoon/activity/?branch=develop](https://lagoon-ci.amazeeio.cloud/blue/organizations/jenkins/lagoon/activity/?branch=develop)
* `main` branch: [https://lagoon-ci.amazeeio.cloud/blue/organizations/jenkins/lagoon/activity/?branch=main](https://lagoon-ci.amazeeio.cloud/blue/organizations/jenkins/lagoon/activity/?branch=main)
