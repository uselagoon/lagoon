#!/bin/bash
mkdir -p services
mkdir -p node-helpers
mkdir -p docker-executors

git clone -b develop git@github.com:amazeeio/api.git services/api
git clone -b develop git@github.com:amazeeio/elasticsearch.git services/elasticsearch
git clone -b develop git@github.com:amazeeio/jenkins.git services/jenkins
git clone -b develop git@github.com:amazeeio/jenkins-slave.git services/jenkins-slave
git clone -b develop git@github.com:amazeeio/kibana.git services/kibana
git clone -b develop git@github.com:amazeeio/logs2slack.git services/logs2slack
git clone -b develop git@github.com:amazeeio/logstash.git services/logstash
git clone -b develop git@github.com:amazeeio/openshiftdeploy.git services/openShiftDeploy
git clone -b develop git@github.com:amazeeio/openshiftremove.git services/openShiftRemove
git clone -b develop git@github.com:amazeeio/rabbitmq.git services/rabbitmq
git clone -b develop git@github.com:amazeeio/webhook-handler.git services/webhook-handler
git clone -b develop git@github.com:amazeeio/webhooks2tasks.git services/webhooks2tasks

git clone -b develop git@github.com:amazeeio/local-git-server.git local-git-server
git clone -b ci-local git@github.com:amazeeio/api-test-hiera.git hiera

git clone -b develop git@github.com:amazeeio/docker-oc-build-deploy.git docker-executors/docker-oc-build-deploy