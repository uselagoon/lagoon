# Lagoon testing

Our tests are all written with Ansible and mostly follow this approach:

1. They create a new git repository
2. Add and commit some files from a list of files (in `tests/files`) into this git repo
3. Push this git repo into a git server (either locally or on Github)
4. Send a trigger to a trigger service (for example a Webhook to the Webhook Handler which is the same as a real webhook that would be sent)
5. Starts to monitor the URL that the test would expect something to happen (like deploying a nodejs app that has the git branch as an HTML text)
6. Compares the result on the URL with the expected result

Lagoon is mostly tested in 3 different ways:

## 1. Locally

During local development the best and easiest is to test locally. For that you need all microservices running `docker-compose up -d` and the MiniShift OpenShift running as well: `./startOpenShift.sh`.

Now you can run tests, via ansible:

    docker-compose run --rm tests ansible-playbook /ansible/tests/ALL.yaml

This would run all tests defined in `tests/playbooks/ALL.yaml`. If you like only to run a subset of the tests, it's best to define the path to the test that you like to run in the `docker-compose run` statement.

Sometimes you just would like to create another push webhook, without to wait for the git repo to be initialized and beeing pushed. For this case there is a small helper script `tests/playbooks/helpers/just-push.yaml` that will get the current head of the git repo and push a webhook push. It needs to know which git repo and branch you would like to check and push:

		docker-compose exec tests ansible-playbook /ansible/tests/tests/helpers/just-push.yaml -e git_repo_name=node.git -e branch=develop

In order to actually see what is happening inside the microservices, we can use `docker-compose logs`:

		docker-compose logs -f

Or only for a specific service:

		docker-compose logs -f webhook-handler

Sometimes you would like to see what is happening inside the Jenkins, it can be found here: http://localhost:8888/ (`admin`:`admin`)

## 2. Automated integration testing

In order to test pull requests that are created against Lagoon, we have a full automatic integration test running on Jenkins here: http://lagoon-ci.amazeeio.cloud/. It is defined inside the `Jenkinsfile` and runs automatically for every pull request that is opened.

This Jenkins Job will start a minishift and all services inside the Jenkins and run all tests against it, when everything is fine it will update the GitHub Pull Request with the result of the test.

## 3. Real World Testing

To make sure that our services also work in the real work (eg deployed on OpenShift with real URLs, real git repos and stuff), we also have tests for this. Currently we only deploy the `develop` and `master` branches to a real OpenShift infrastructure.

For these tests we use the exact same Ansible scripts like the local or the automated testing, we just push to an actual Github Repo https://github.com/amazeeio-ci-testing and send webhooks to the webhook-handler that are running OpenShift.

The tests are defined in `Jenkinsfile.testing-develop` and `Jenkinsfile.testing-master`. They get their testing infrastructure (endpoints, etc.) from a docker-compose.yaml file within the `tests` folder.

Beside of that it's exactly the same as the automated integration testing.

The tests can be found here:
- `develop` branch: https://lagoon-ci.amazeeio.cloud/job/lagoon-test-develop/
- `master` branch: https://lagoon-ci.amazeeio.cloud/job/lagoon-test-master/
