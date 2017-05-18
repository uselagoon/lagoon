#!/bin/bash
mkdir -p services
mkdir -p node-helpers

git clone -b develop git@github.com:amazeeio/rabbitmq.git services/rabbitmq
git clone -b develop git@github.com:amazeeio/webhook-handler.git services/webhook-handler
git clone -b develop git@github.com:amazeeio/webhooks2tasks.git services/webhooks2tasks
git clone -b develop git@github.com:amazeeio/logs2slack.git services/logs2slack
git clone -b develop git@github.com:amazeeio/gitpush2ansibledeploy.git services/gitpush2ansibledeploy
git clone -b develop git@github.com:amazeeio/api.git services/api
git clone -b develop git@github.com:amazeeio/jenkins.git services/jenkins
git clone -b develop git@github.com:amazeeio/jenkins-slave.git services/jenkins-slave
git clone -b develop git@github.com:amazeeio/ansible-drupal-deploy.git services/ansible-drupal-deploy
git clone -b develop git@github.com:amazeeio/elasticsearch.git services/elasticsearch
git clone -b develop git@github.com:amazeeio/kibana.git services/kibana
git clone -b develop git@github.com:amazeeio/logstash.git services/logstash
git clone -b develop git@github.com:amazeeio/openshiftdeploy.git services/OpenShiftDeploy
git clone -b develop git@github.com:amazeeio/openshiftremove.git services/OpenShiftRemove

git clone -b develop git@github.com:amazeeio/node-amazeeio-logs.git node-helpers/amazeeio-logs
git clone -b develop git@github.com:amazeeio/local-git-server.git local-git-server
git clone -b deploytest git@github.com:amazeeio/api-test-hiera.git hiera
git clone -b AmazeeDevel git@git.vshn.net:amazee/puppet-drupalhosting.git virtual-machine
git clone -b develop git@github.com:amazeeio/deploytest.git deploytest

cd virtual-machine && vagrant up deploytest

cd ..