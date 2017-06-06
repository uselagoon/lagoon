#!/bin/bash

brew cask install minishift
minishift start --vm-driver virtualbox --host-only-cidr "192.168.77.1/24"