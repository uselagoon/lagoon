!!!warning
    **Note:** This documentation relates to developing the 1.x releases of Lagoon, built from the `master` branch.
    For documentation on the current development version of Lagoon, 2.x, built from the `main` branch, please visit https://docs.lagoon.sh

# Tests

All of our test are written with [Ansible](https://docs.ansible.com/ansible/latest/index.html) and mostly follow this approach:

1. They create a new Git repository.
2. Add and commit some files from a list of files \(in `tests/files`\) into this Git repository.
3. Push this Git repository to a Git server \(either locally or on GitHub\).
4. Send a trigger to a trigger service \(for example a webhook to the webhook handler, which is the same as a real webhook that would be sent\).
5. Starts to monitor the URL at which the test would expect something to happen \(like deploying a Node.js app that has the Git branch as an HTML text\).
6. Compares the result on the URL with the expected result.

Lagoon is mostly tested in 3 different ways:

## 1. Locally

During local development, the best and easiest way is to test locally. All tests are started via `make`. Make will download and build all the required dependencies.

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

[http://localhost:8888/](http://localhost:8888/)       \(`admin`:`admin`\)

Sometimes you just want to create another push webhook without having to wait for the Git repository to be initialized and pushed.

In this case, there is a small helper script, `tests/playbooks/helpers/just-push.yaml,` that will get the current HEAD of the Git repository and push a webhook push. It needs to know which Git repository and branch you would like to check and push:

```text
docker-compose -p lagoon exec tests ansible-playbook /ansible/tests/tests/helpers/just-push.yaml -e git_repo_name=node.git -e branch=develop
```

## 2. Automated integration testing

In order to test pull requests that are created against Lagoon, we have a fully automatic integration test running on [`TravisCI`](https://docs.travis-ci.com/): [https://travis-ci.org/amazeeio/lagoon](https://travis-ci.org/amazeeio/lagoon). It is defined inside the `.travis.yml` file, and runs automatically for every pull request that is opened.

This will build all images, start an OpenShift and run all tests.

## 3. Real World Testing

To make sure that our services also work in the real world \(for example, deployed on OpenShift with real URLs, real Git repositories, etc.\), we also have tests for this. Currently we only deploy the `develop` and `master` branches to a real OpenShift infrastructure.

For these tests, we use the exact same Ansible scripts, and just like the local and automated testing, we  push to an actual GitHub repository \([https://github.com/amazeeio-ci-testing](https://github.com/amazeeio-ci-testing)\), and send webhooks to webhook handlers that are running OpenShift.

These tests are defined in `Jenkinsfile.testing-develop` and `Jenkinsfile.testing-master`. They get their testing infrastructure \(endpoints, etc.\) from a `docker-compose.yml` file within the `tests` folder.

Besides that, it's exactly the same as the automated integration testing.

The tests can be found here:

* `develop` branch: [https://lagoon-ci.amazeeio.cloud/blue/organizations/jenkins/lagoon/activity?branch=develop](https://lagoon-ci.amazeeio.cloud/blue/organizations/jenkins/lagoon/activity?branch=develop)
* `master` branch: [https://lagoon-ci.amazeeio.cloud/blue/organizations/jenkins/lagoon/activity/?branch=master](https://lagoon-ci.amazeeio.cloud/blue/organizations/jenkins/lagoon/activity/?branch=master)

