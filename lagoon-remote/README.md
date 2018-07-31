# Lagoon Remote

## design flowchart
https://docs.google.com/drawings/d/1kMCJn3R2sUtiNYraG9mNce-Od8n_6oq-asoR6ISHn_8/edit

## details

There are multiple portions to this repo;

### collector

The collector is a fluentd instance configured for `secure_forward` on for
both input and output. The `secure_forward` plugin is configured insecurely
between itself and the DaemonSet nodes. Across openshift clusters,
it is configured with a CA Certificate and requires additional manual
configuration.



### logstash

#### haproxy

  1. create router-logs service
  ~~~~
  oc apply -n lagoon -f supplemental/lagoon-svc-router-logs.yml  
  ~~~~

  1. The openshift haproxy needs to be configured to forward to logstash.
  Update `ROUTER_SYSLOG_ADDRESS` to `router-logs.lagoon.svc:5140`.
  ~~~~
  oc -n default edit dc/router
  ~~~~

Also update the template with #xxx



Additionally, `DESTINATION` needs to be set in in the `lagoon-env`
configmap for the deployed project.  In production, this will be
https://logs2logs-lagoon-master.ch.amazee.io .
~~~~
oc -n lagoon-remote-us edit configmap/lagoon-env
~~~~

lagoon project

apiVersion: v1
kind: Service
metadata:
  creationTimestamp: null
  name: router-logs
spec:
  externalName: logstash.lagoon-remote-us-master.svc.cluster.local
  sessionAffinity: None
  type: ExternalName


oc -n default patch deploymentconfig/router \
-p  '{"spec":{"template":{"spec":{"containers":{"env": {"name":"blah", "value":"Baz"}}}}}}''
