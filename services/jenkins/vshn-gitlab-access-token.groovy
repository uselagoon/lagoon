#!groovy
import com.cloudbees.plugins.credentials.impl.*;
import com.cloudbees.plugins.credentials.*;
import com.cloudbees.plugins.credentials.domains.*;

Credentials c = (Credentials) new UsernamePasswordCredentialsImpl(CredentialsScope.GLOBAL,"vshn-gitlab-access-token", "vshn-gitlab-access-token", "michael.schmid", "r9HZtVjqWXYFNDtm36xH")

SystemCredentialsProvider.getInstance().getStore().addCredentials(Domain.global(), c)
