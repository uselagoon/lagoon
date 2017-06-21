#!groovy
import com.cloudbees.plugins.credentials.impl.*;
import com.cloudbees.plugins.credentials.*;
import com.cloudbees.plugins.credentials.domains.*;

Credentials c = (Credentials) new UsernamePasswordCredentialsImpl(CredentialsScope.GLOBAL,"amazeeio-github-bearer-token", "amazeeio-github-bearer-token", "amazeeio", "3dfc013c579f85bbcd4cd0c5d11cda325a086ec8")

SystemCredentialsProvider.getInstance().getStore().addCredentials(Domain.global(), c)
