pipeline {
  agent { label 'lagoon' }
  environment {
    // configure build params
    CI_BUILD_TAG = env.BUILD_TAG.replaceAll('%2f','').replaceAll('[^A-Za-z0-9]+', '').toLowerCase()
    SAFEBRANCH_NAME = env.BRANCH_NAME.replaceAll('%2f','-').replaceAll('[^A-Za-z0-9]+', '-').toLowerCase()
    NPROC = "${sh(script:'getconf _NPROCESSORS_ONLN', returnStdout: true).trim()}"
    SKIP_IMAGE_PUBLISH = credentials('SKIP_IMAGE_PUBLISH')
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
    stage ('refresh upstream images') {
      when {
        not {
          buildingTag()
        }
      }
      steps {
        sh script: "make -O -j$NPROC docker_pull", label: "Ensuring fresh upstream images"
      }
    }
    stage ('build images') {
      steps {
        sh script: "make -O -j$NPROC build", label: "Building images"
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
    stage ('setup test cluster') {
      parallel {
        stage ('0: setup test cluster') {
          steps {
            sh script: "make -j$NPROC kind/test TESTS=[nginx] BRANCH_NAME=${SAFEBRANCH_NAME}", label: "Setup cluster and run nginx smoketest"
            sh script: "pkill -f './local-dev/stern'", label: "Closing off test-suite-0 log after test completion"
          }
        }
        stage ('collect logs') {
          steps {
            sh script: "while [ ! -f ./kubeconfig.kind.${CI_BUILD_TAG} ]; do sleep 1; done", label: "Check for kubeconfig created"
            timeout(time: 30, unit: 'MINUTES') {
              sh script: "./local-dev/stern --kubeconfig ./kubeconfig.kind.${CI_BUILD_TAG} --all-namespaces '^[a-z]' -t > test-suite-0.txt || true", label: "Collecting test-suite-0 logs"
            }
            sh script: "cat test-suite-0.txt", label: "View ${NODE_NAME}:${WORKSPACE}/test-suite-0.txt"
          }
        }
      }
    }
    stage ('run first test suite') {
      parallel {
        stage ('1: run first test suite') {
          steps {
            sh script: "make -j$NPROC kind/retest TESTS=[api,deploytarget,active-standby-kubernetes,features-kubernetes,features-kubernetes-2,features-api-variables,tasks,ssh-portal] BRANCH_NAME=${SAFEBRANCH_NAME}", label: "Running first test suite on kind cluster"
            sh script: "pkill -f './local-dev/stern'", label: "Closing off test-suite-1 log after test completion"
          }
        }
        stage ('collect logs') {
          steps {
            timeout(time: 30, unit: 'MINUTES') {
              sh script: "./local-dev/stern --kubeconfig ./kubeconfig.kind.${CI_BUILD_TAG} --all-namespaces '^[a-z]' --since 1s -t > test-suite-1.txt || true", label: "Collecting test-suite-1 logs"
            }
            sh script: "cat test-suite-1.txt", label: "View ${NODE_NAME}:${WORKSPACE}/test-suite-1.txt"
          }
        }
      }
    }
    stage ('run second test suite') {
      parallel {
        stage ('2: run second test suite') {
          steps {
            catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                sh script: "make -j$NPROC kind/retest TESTS=[gitlab,github,bitbucket,python,node-mongodb,elasticsearch,image-cache] BRANCH_NAME=${SAFEBRANCH_NAME}", label: "Running second test suite on kind cluster"
            }
            sh script: "pkill -f './local-dev/stern'", label: "Closing off test-suite-2 log after test completion"
          }
        }
        stage ('collect logs') {
          steps {
            timeout(time: 30, unit: 'MINUTES') {
              sh script: "./local-dev/stern --kubeconfig ./kubeconfig.kind.${CI_BUILD_TAG} --all-namespaces '^[a-z]' --since 1s -t > test-suite-2.txt || true", label: "Collecting test-suite-2 logs"
            }
            sh script: "cat test-suite-2.txt", label: "View ${NODE_NAME}:${WORKSPACE}/test-suite-2.txt"
          }
        }
      }
    }
    stage ('run third test suite') {
      parallel {
        stage ('3: run third test suite') {
          steps {
            catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                sh script: "make -j$NPROC kind/retest TESTS=[drupal-php80,drupal-postgres,drush] BRANCH_NAME=${SAFEBRANCH_NAME}", label: "Running third test suite on kind cluster"
            }
            sh script: "pkill -f './local-dev/stern'", label: "Closing off test-suite-3 log after test completion"
          }
        }
        stage ('collect logs') {
          steps {
            timeout(time: 30, unit: 'MINUTES') {
              sh script: "./local-dev/stern --kubeconfig ./kubeconfig.kind.${CI_BUILD_TAG} --all-namespaces '^[a-z]' --since 1s -t > test-suite-3.txt || true", label: "Collecting test-suite-3 logs"
            }
            sh script: "cat test-suite-3.txt", label: "View ${NODE_NAME}:${WORKSPACE}/test-suite-3.txt"
          }
        }
      }
    }
    stage ('push images to testlagoon/* with :latest tag') {
      when {
        branch 'main'
        not {
          environment name: 'SKIP_IMAGE_PUBLISH', value: 'true'
        }
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
        not {
          environment name: 'SKIP_IMAGE_PUBLISH', value: 'true'
        }
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
    stage ('scan built images') {
      when {
        anyOf {
          branch 'testing/scans'
          buildingTag()
        }
      }
      steps {
        sh script: 'make scan-images', label: "perform scan routines"
        sh script:  'find ./scans/*trivy* -type f | xargs tail -n +1', label: "Show Trivy vulnerability scan results"
        sh script:  'find ./scans/*grype* -type f | xargs tail -n +1', label: "Show Grype vulnerability scan results"
        sh script:  'find ./scans/*syft* -type f | xargs tail -n +1', label: "Show Syft SBOM results"
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
