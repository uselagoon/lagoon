#!/bin/bash

git clone -b develop git@github.com:amazeeio/rabbitmq.git services/rabbitmq
git clone -b develop git@github.com:amazeeio/webhook-handler.git services/webhook-handler
git clone -b develop git@github.com:amazeeio/gitpush2ansibledeploy.git services/gitpush2ansibledeploy
git clone -b develop git@github.com:amazeeio/api.git services/api
git clone -b develop git@github.com:amazeeio/local-git-server.git local-git-server
git clone -b deploytest git@github.com:amazeeio/api-test-hiera.git hiera
git clone -b AmazeeDevel git@git.vshn.net:amazee/puppet-drupalhosting.git virtual-machine
git clone -b develop git@github.com:amazeeio/ansible-drupal-deploy.git services/ansible-drupal-deploy

cd virtual-machine && vagrant up deploytest