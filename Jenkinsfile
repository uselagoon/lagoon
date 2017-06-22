node {
  def docker_compose = "docker run -t --rm -v \$WORKSPACE:\$WORKSPACE -v /var/run/docker.sock:/var/run/docker.sock -w \$WORKSPACE docker/compose:1.13.0 -p lagoon"


  deleteDir()

  stage ('Checkout') {
    checkout([
         $class: 'GitSCM',
         branches: scm.branches,
         doGenerateSubmoduleConfigurations: scm.doGenerateSubmoduleConfigurations,
         extensions: [[$class: 'SubmoduleOption', disableSubmodules: false, parentCredentials: true, recursiveSubmodules: false, reference: '', trackingSubmodules: false]],
         userRemoteConfigs: scm.userRemoteConfigs
    ])
    // create a new branch 'ci-local' from the current HEAD, this is necessary as the api service searches for a branch 'ci-local'
    sh "cd hiera && git branch -f ci-local HEAD && cd .."
  }

  lock('minishift') {
    try {
      ansiColor('xterm') {
        parallel (
          'start services': {
            stage ('start services') {
              sh "${docker_compose} up -d --force --build"
            }
          },
          'start openshift': {
            stage ('start openshift') {
              sh './startOpenShift.sh'
            }
          }
        )


        parallel (
          '_tests': {
              stage ('run tests') {
                sh "${docker_compose} exec tests ansible-playbook /ansible/playbooks/node.yaml"
                cleanup(docker_compose)
              }
          },
          'webhook-handler logs': {
              stage ('webhook-handler') {
                sh "${docker_compose} logs -f webhook-handler"
              }
          },
          'webhooks2tasks logs': {
              stage ('webhooks2tasks') {
                sh "${docker_compose} logs -f webhooks2tasks"
              }
          },
          'openshiftdeploy logs': {
              stage ('openshiftdeploy') {
                sh "${docker_compose} logs -f openshiftdeploy"
              }
          },
          'openshiftremove logs': {
              stage ('openshiftremove') {
                sh "${docker_compose} logs -f openshiftremove"
              }
          },
          'all logs': {
              stage ('all') {
                sh "${docker_compose} logs -f "
              }
          }
        )
      }
    } catch (e) {
      echo "Something went wrong, trying to cleanup"
      cleanup(docker_compose)
      throw e
    }
  }
}

def cleanup(docker_compose) {
  try {
    sh "${docker_compose} down -v"
    sh "./minishift/minishift delete"
  } catch (error) {
    echo "cleanup failed, ignoring this."
  }
}
