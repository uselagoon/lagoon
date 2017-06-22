#! /bin/bash -e

if [[ -L ${JENKINS_HOME}/caches ]]; then
  echo "cache directory already linked";
else
  /bin/ln -s /tmp ${JENKINS_HOME}/caches ;
fi

exec /usr/local/bin/jenkins.sh
