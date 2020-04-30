{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "lagoon-remote.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "lagoon-remote.dockerHost.fullname" -}}
{{- .Values.dockerHost.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "lagoon-remote.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "lagoon-remote.labels" -}}
helm.sh/chart: {{ include "lagoon-remote.chart" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "lagoon-remote.dockerHost.labels" -}}
helm.sh/chart: {{ include "lagoon-remote.chart" . }}
{{ include "lagoon-remote.dockerHost.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels
*/}}
{{- define "lagoon-remote.dockerHost.selectorLabels" -}}
app.kubernetes.io/name: {{ include "lagoon-remote.dockerHost.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Create the name of the service account to use
*/}}
{{- define "lagoon-remote.dockerHost.serviceAccountName" -}}
{{- if .Values.dockerHost.serviceAccount.create -}}
    {{ default (include "lagoon-remote.dockerHost.fullname" .) .Values.dockerHost.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.dockerHost.serviceAccount.name }}
{{- end -}}
{{- end -}}


{{/*
Create the name of the service account to use
*/}}
{{- define "lagoon-remote.kubernetesbuilddeploy.serviceAccountName" -}}
{{ .Values.kubernetesbuilddeploy.serviceAccountName }}
{{- end -}}