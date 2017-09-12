node {
  // During creating openshift, 'oc cluster up' creates some config files (for docker login, oc login, etc)
  // They are by default put in $HOME, where it could happen that multiple builds put the same files and overwrite each
  // other and lead to weird build fails. We're setting the HOME directory to the current workspace to prevent that
  env.HOME = env.WORKSPACE

  // MACHINE_STORAGE_PATH will be used by docker-machine and 'oc cluster up' to define where to put the docker machines
  // We want them all in a unified place to be able to know how many machines there are, etc. So we put them in the
  // Jenkins HOME Folder
  env.MACHINE_STORAGE_PATH = "${env.JENKINS_HOME}/.docker/machine"
  env.VBOX_USER_HOME = "${env.JENKINS_HOME}/.config/VirtualBox"

  try {
    env.CI_BUILD_TAG = env.BUILD_TAG.toLowerCase().replaceAll('%2f','-').replaceAll('-','')
    env.SAFEBRANCH_NAME = env.BRANCH_NAME.toLowerCase().replaceAll('%2f','-')

    deleteDir()

    stage ('Checkout') {
      def checkout = checkout scm
      env.GIT_COMMIT = checkout["GIT_COMMIT"]
    }

    notifySlack()

    try {
      parallel (
        'build & start services': {
          stage ('build images') {
            sh "make build"
          }
          stage ('start services') {
            sh "make up-no-ports"
          }
        },
        'start openshift': {
          stage ('start openshift') {
            sh 'make openshift'
          }
        }
      )
    } catch (e) {
      echo "Something went wrong, trying to cleanup"
      cleanup()
      throw e
    }

    parallel (
      '_tests': {
          stage ('run tests') {
            try {
              sh "sleep 30"
              sh "make tests -j2"
            } catch (e) {
              echo "Something went wrong, trying to cleanup"
              cleanup()
              throw e
            }
            cleanup()
          }
      },
      'logs': {
          stage ('all') {
            sh "make logs"
          }
      }
    )


    stage ('publish-amazeeiolagoon') {
      withCredentials([string(credentialsId: 'amazeeiojenkins-dockerhub-password', variable: 'PASSWORD')]) {
        sh 'docker login -u amazeeiojenkins -p $PASSWORD'
        sh "make publish-amazeeiolagoon PUBLISH_TAG=${SAFEBRANCH_NAME}"
      }
    }

    if (env.BRANCH_NAME == 'master') {
      stage ('publish-amazeeio') {
        withCredentials([string(credentialsId: 'amazeeiojenkins-dockerhub-password', variable: 'PASSWORD')]) {
          sh 'docker login -u amazeeiojenkins -p $PASSWORD'
          sh "make publish-amazeeio"
        }
      }
    }

    if (env.BRANCH_NAME ==~ /develop|master/) {
      stage ('start-lagoon-deploy') {
        sh "curl -X POST http://rest2tasks.lagoon.master.appuio.amazee.io/deploy -H 'content-type: application/json' -d '{ \"siteGroupName\": \"lagoon\", \"branchName\": \"${env.BRANCH_NAME}\",\"sha\": \"${env.GIT_COMMIT}\" }'"
      }
    }
  } catch (e) {
    currentBuild.result = 'FAILURE'
    throw e
  } finally {
    notifySlack(currentBuild.result)
  }

}

def cleanup() {
  try {
    sh "make down"
//    sh "make openshift/clean"
//    sh "make clean"
  } catch (error) {
    echo "cleanup failed, ignoring this."
  }
}

def notifySlack(String buildStatus = 'STARTED') {
    // Build status of null means success.
    buildStatus = buildStatus ?: 'SUCCESS'

    def color

    if (buildStatus == 'STARTED') {
        color = '#68A1D1'
    } else if (buildStatus == 'SUCCESS') {
        color = '#BDFFC3'
    } else if (buildStatus == 'UNSTABLE') {
        color = '#FFFE89'
    } else {
        color = '#FF9FA1'
    }

    def msg = "${buildStatus}: `${env.JOB_NAME}` #${env.BUILD_NUMBER}:\n${env.BUILD_URL}"

    slackSend(color: color, message: msg)
}
