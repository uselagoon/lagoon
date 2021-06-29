pipeline {
  agent { label 'lagoon' }
  environment {
    // configure build params
    CI_BUILD_TAG = env.BUILD_TAG.replaceAll('%2f','').replaceAll('[^A-Za-z0-9]+', '').toLowerCase()
    SAFEBRANCH_NAME = env.BRANCH_NAME.replaceAll('%2f','-').replaceAll('[^A-Za-z0-9]+', '-').toLowerCase()
    NPROC = "${sh(script:'getconf _NPROCESSORS_ONLN', returnStdout: true).trim()}"
  }

  stages {
    stage ('notify started') {
      steps {
        notifySlack('STARTED')
      }
    }
    stage ('env') {
      steps {
        sh 'env'
      }
    }
    // in order to have the newest images from upstream (with all the security
    // updates) we clean our local docker cache on tag deployments
    // we don't do this all the time to still profit from image layer caching
    // but we want this on tag deployments in order to ensure that we publish
    // images always with the newest possible images.
    stage ('clean docker image cache') {
      when {
        buildingTag()
      }
      steps {
        sh script: "docker image prune -af", label: "Pruning images"
      }
    }
    stage ('build images') {
      steps {
        sh script: "make -O -j$NPROC build SCAN_IMAGES=true", label: "Building images"
      }
    }
    stage ('show trivy scan results') {
      steps {
        sh script: "cat scan.txt", label: "Display scan results"
      }
    }
    stage ('push images to testlagoon/*') {
      when {
        not {
          environment name: 'SKIP_IMAGE_PUBLISH', value: 'true'
        }
      }
      environment {
        PASSWORD = credentials('amazeeiojenkins-dockerhub-password')
      }
      steps {
        sh script: 'docker login -u amazeeiojenkins -p $PASSWORD', label: "Docker login"
        sh script: "make -O -j$NPROC publish-testlagoon-baseimages publish-testlagoon-serviceimages publish-testlagoon-taskimages BRANCH_NAME=${SAFEBRANCH_NAME}", label: "Publishing built images"
      }
    }
    stage ('run test suite') {
      steps {
        sh script: "make -j$NPROC kind/test BRANCH_NAME=${SAFEBRANCH_NAME}", label: "Running tests on kind cluster"
      }
    }
    stage ('push images to testlagoon/* with :latest tag') {
      when {
        branch 'main'
      }
      environment {
        PASSWORD = credentials('amazeeiojenkins-dockerhub-password')
      }
      steps {
        sh script: 'docker login -u amazeeiojenkins -p $PASSWORD', label: "Docker login"
        sh script: "make -O -j$NPROC publish-testlagoon-baseimages publish-testlagoon-serviceimages publish-testlagoon-taskimages BRANCH_NAME=latest", label: "Publishing built images with :latest tag"
      }
    }
    stage ('deploy to test environment') {
      when {
        branch 'main'
      }
      environment {
        TOKEN = credentials('vshn-gitlab-helmfile-ci-trigger')
      }
      steps {
        sh script: "curl -X POST -F token=$TOKEN -F ref=master https://git.vshn.net/api/v4/projects/1263/trigger/pipeline", label: "Trigger lagoon-core helmfile sync on amazeeio-test6"
      }
    }
    stage ('push images to uselagoon/*') {
      when {
        buildingTag()
        not {
          environment name: 'SKIP_IMAGE_PUBLISH', value: 'true'
        }
      }
      environment {
        PASSWORD = credentials('amazeeiojenkins-dockerhub-password')
      }
      steps {
        sh script: 'docker login -u amazeeiojenkins -p $PASSWORD', label: "Docker login"
        sh script: "make -O -j$NPROC publish-uselagoon-baseimages publish-uselagoon-serviceimages publish-uselagoon-taskimages", label: "Publishing built images to uselagoon"
      }
    }
  }

  post {
    always {
      sh "make clean kind/clean"
    }
    success {
      notifySlack('SUCCESS')
      deleteDir()
    }
    failure {
      notifySlack('FAILURE')
    }
    aborted {
      notifySlack('ABORTED')
    }
  }
}

def notifySlack(String status) {
  slackSend(
    color: ([STARTED: '#68A1D1', SUCCESS: '#BDFFC3', FAILURE: '#FF9FA1', ABORTED: '#949393'][status]),
    message: "${status}: `${env.JOB_NAME}` #${env.BUILD_NUMBER}:\n${env.BUILD_URL}")
}
