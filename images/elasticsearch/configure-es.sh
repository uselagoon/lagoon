#! /bin/bash

# Copyright 2016 The Kubernetes Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

CFG=/usr/share/elasticsearch/config/elasticsearch.yml


function join {
    local IFS="$1"; shift; echo "$*";
}

HOSTNAME=$(hostname)
# Parse out cluster name, from service name:
CLUSTER_NAME="$(hostname -f | cut -d'.' -f2)"

while read -ra LINE; do
    if [[ "${LINE}" == *"${HOSTNAME}"* ]]; then
        MY_NAME=$LINE
    fi
    PEERS=("${PEERS[@]}" $LINE)
done

if [ "${#PEERS[@]}" = 1 ]; then
    ES_CLUSTER_ADDRESS="$MY_NAME"
else
    ES_CLUSTER_ADDRESS=$(join , "${PEERS[@]}")
fi

echo "discovery.zen.ping.unicast.hosts: ${ES_CLUSTER_ADDRESS}" >> ${CFG}

# don't need a restart, we're just writing the conf in case there's an
# unexpected restart on the node.
