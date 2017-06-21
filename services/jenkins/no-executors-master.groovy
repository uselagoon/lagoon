#!groovy
import hudson.security.*
import jenkins.model.*

def instance = Jenkins.getInstance()

println "--> Setting Executors to 0, we only run stuff on slaves"

instance.numExecutors = 0
instance.save()
