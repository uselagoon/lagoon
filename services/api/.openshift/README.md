# OpenShift

## Jenkins Access to Openshift

In order for Jenkins to deploy to openshift we need to create an openshift serviceaccount that has access to our project (regular username/password logins expire after a couple of hours, not very good for a CI/CD system)

1. Login as your user

        oc login

2. Create new serviceaccount with the name jenkins

        oc create serviceaccount jenkins

3. Give this serviceaccount edit access (see the name of the serviceaccount contains the project name!)

        oc policy add-role-to-user edit system:serviceaccount:appuio-demo2:jenkins2

4. Get access token from serviceaccount, with first getting the name of the token and then accessing the secret

        oc describe serviceaccount jenkins2

        oc describe secret jenkins2-token-7tawv

5. Add the token inside the .kubeconfig:


        apiVersion: v1
        clusters:
        - cluster:
            server: https://console.appuio.ch:443
          name: appuio
        contexts:
        - context:
            cluster: appuio
            user: jenkins
          name: appuio:jenkins
        current-context: appuio:jenkins
        kind: Config
        preferences: {}
        users:
        - name: jenkins
          user:
            token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJhbXplLXJhcyIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJqZW5raW5zLXRva2VuLTFocW42Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImplbmtpbnMiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC51aWQiOiI5ZmM4ZTIzMi05ZDBhLTExZTYtYTdlZi1mYTE2M2VkOTVkYWMiLCJzdWIiOiJzeXN0ZW06c2VydmljZWFjY291bnQ6YW16ZS1yYXM6amVua2lucyJ9.BAeU6zXl0uPCD2DRGJeV1oxRbk3sA3M5tn7K6xPh5iv-etS8Q2lsF-OFwO7HVycvEckXh31KNUmQTzvn3keSDT0a8BqViBhGPKCfAw-vf3ElUnGFDCWN9IpITKJBWIxVdGyd5sPltBWkAVxl9JOwnu1vrBvSioYqwjzYkjStbfp7pzLXhSld9G4AXA_zBntDW633mujllT0z_5IMSJX_gKSZcrTN78KLdCMmuvIT_m7xZMp_r52daEu67DjsjYtVqVx4BsDVPdUZRQ9eJtodbtZ-FJV9w0W4H9nX3iyqCk7OriD4Xt68Z5cUK0tR-4hyyh_hL31c6vzGb_VosmAWWg


6. Test the kubeconfig - should return `system:serviceaccount:appuio-demo2:jenkins2`

        KUBECONFIG=.openshift/.kubeconfig oc whoami

7. Create a Docker authentication config.json so Jenkins can push into the Openshift docker Registry

        DOCKER_CONFIG=.openshift/ docker login -u jenkins2 -p $(KUBECONFIG=.openshift/.kubeconfig oc whoami -t) registry.appuio.ch