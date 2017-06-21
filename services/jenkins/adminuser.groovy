#!groovy
import hudson.security.*
import jenkins.security.ApiTokenProperty    
import jenkins.model.*
import org.jenkinsci.plugins.googlelogin.*
import hudson.util.Secret
import hudson.model.User

def instance = Jenkins.getInstance()

println "--> Checking if security has been set already"

if (!instance.isUseSecurity()) {
    println "--> creating local user 'admin'"

    def hudsonRealm = new HudsonPrivateSecurityRealm(false)
    hudsonRealm.createAccount('admin', System.getenv("ADMIN_PASSWORD"))
    instance.setSecurityRealm(hudsonRealm)

    def strategy = new FullControlOnceLoggedInAuthorizationStrategy()
    strategy.setAllowAnonymousRead(false)
    instance.setAuthorizationStrategy(strategy)
    instance.save()
}


// this sets the api token of user admin to the md5 of 'fZk3bf7hsbZCQ4kYHeYkXYNitCoy6u3BbmZrm9FR': 506accdcb5ade450a3b5cb2ce46cb8b8
// see https://github.com/jenkinsci/jenkins/blob/master/core/src/main/java/jenkins/security/ApiTokenProperty.java#L105
// which uses https://github.com/jenkinsci/jenkins/blob/master/core/src/main/java/hudson/Util.java#L763 which uses md5
def username = 'admin'
def seed = 'fZk3bf7hsbZCQ4kYHeYkXYNitCoy6u3BbmZrm9FR'

def user = User.get(username)

def tokprop =  user.getProperty(ApiTokenProperty.class)
tokprop.apiToken = Secret.fromString(seed)
user.save()

println "--> setting api token of user 'admin' to:"
println(tokprop.getApiTokenInsecure())