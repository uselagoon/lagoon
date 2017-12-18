# Metrics Charts

---

This document describes the Helm Charts that are used in the Metrics solution.

---

<a name="prometheus"></a>
## Prometheus

The Prometheus Helm Chart can be found in the `charts/prometheus-dpc/` directory.  It was created by taking a copy of the standard Prometheus Helm [Chart](https://github.com/kubernetes/charts/tree/master/stable/prometheus) and then modifying it.

### Modifications

1. An `openshift` key with a default value of `false` was added to the [`values.yaml`](../charts/prometheus-dpc/values.yaml) file.
2. A [`templates/server-route.yaml`](../charts/prometheus-dpc/templates/server-route.yaml) file was added.  This creates an OpenShift `Route` resource for the Prometheus server that is used in place of a Kubernetes `Ingress` resource.  For this to occur the `openshift` key must be set to `true`.


<a name="grafana"></a>
## Grafana

The Grafana Helm Chart can be found in the `charts/grafana-dpc/` directory.  It was created by taking a copy of the standard Grafana Helm [Chart](https://github.com/kubernetes/charts/tree/master/stable/grafana) and then modifying it. 

### Modifications

1. An `openshift` key with a default value of `false` was added to the [`values.yaml`](../charts/grafana-dpc/values.yaml) file.
2. A [`templates/route.yaml`](../charts/grafana-dpc/templates/route.yaml) file was added.  This creates an OpenShift `Route` resource that is used in place of a Kubernetes `Ingress` resource.  For this to occur the `openshift` key must be set to `true`.
3. A [`job-notify.yaml`](../charts/grafana-dpc/templates/job-notify.yaml) file was added.  This creates a `Job` that configures a notification channel.  The `server.setNotificationChannel` key in [`values.yaml`](../charts/grafana-dpc/values.yaml) is used to store the notification channel settings.
4. Oauth integration was enabled.  This was done by:
  a. Added a `server.setGenericOauth` key in [`values.yaml`](../charts/grafana-dpc/values.yaml) to store the Oauth settings.
  b. Extending the container environment variables in the [`templates/deployment.yaml`](../charts/grafana-dpc/templates/deployment.yaml) file.
  c. Creating a [`manifests/secret-oauth.yaml`](../charts/grafana-dpc/templates/secret-oauth.yaml) file that defines a `Secret` resource which contains the Oauth Client ID and the Oauth Secret.

The additions to the [`templates/deployment.yaml`](../charts/grafana-dpc/templates/deployment.yaml) file can be seen below.

```
...
...
    {{- if .Values.server.setGenericOauth.enabled }}
    - name:  GF_AUTH_GENERIC_OAUTH_ENABLED
      value: "true"
    - name: GF_AUTH_GENERIC_OAUTH_CLIENT_ID
      valueFrom:
        secretKeyRef:
          name: {{ template "grafana.server.fullname" . }}-oauth
          key: client-id
    - name: GF_AUTH_GENERIC_OAUTH_CLIENT_SECRET
      valueFrom:
        secretKeyRef:
          name: {{ template "grafana.server.fullname" . }}-oauth
          key: client-secret
    - name: GF_AUTH_GENERIC_OAUTH_SCOPES
      value: {{ .Values.server.setGenericOauth.scopes | quote }}
    - name: GF_AUTH_GENERIC_OAUTH_AUTH_URL
      value: {{ .Values.server.setGenericOauth.authUrl | quote }}
    - name: GF_AUTH_GENERIC_OAUTH_TOKEN_URL
      value: {{ .Values.server.setGenericOauth.tokenUrl | quote }}
    - name: GF_AUTH_GENERIC_OAUTH_API_URL
      value: {{ .Values.server.setGenericOauth.apiUrl | quote }}
    # TODO: What about allowedDomains?
    - name: GF_AUTH_GENERIC_OAUTH_ALLOWSIGNUP
      value: {{ .Values.server.setGenericOauth.allowSignUp | quote }}
    {{- end }}
    # The following values are so that Oauth works correctly.
    # But they can be used for other reasons as well.
    # TODO: Might need to put a check that the value exists?
    - name:  GF_SERVER_DOMAIN
      value: {{ .Values.server.serverDomain | quote }}
    - name:  GF_SERVER_ROOT_URL
      value: {{ .Values.server.serverRootUrl | quote }}
...
...
```