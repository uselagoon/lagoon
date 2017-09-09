node {
  try {
    env.CI_BUILD_TAG = env.BUILD_TAG.toLowerCase().replaceAll('%2f','-').replaceAll('-','')

    deleteDir()

    stage ('Checkout') {
      checkout scm
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
              sh "sleep 60"
              sh "make tests"
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


    // stage ('tag_push') {
    //   withCredentials([string(credentialsId: 'amazeeiojenkins-dockerhub-password', variable: 'PASSWORD')]) {
    //     sh 'docker login -u amazeeiojenkins -p $PASSWORD'
    //     sh "./buildBaseImages.sh tag_push amazeeiodev -${SAFEBRANCH_NAME}"
    //   }
    // }

    // if (env.BRANCH_NAME == 'master') {
    //   stage ('tag_push') {
    //     withCredentials([string(credentialsId: 'amazeeiojenkins-dockerhub-password', variable: 'PASSWORD')]) {
    //       sh 'docker login -u amazeeiojenkins -p $PASSWORD'
    //       sh "./buildBaseImages.sh tag_push amazeeio"
    //     }
    //   }
    // }
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
    sh "make openshift/clean"
    sh "make clean"
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
