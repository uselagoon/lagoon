{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "cli-persistent.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "cli-persistent.fullname" -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "cli-persistent.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "cli-persistent.labels" -}}
helm.sh/chart: {{ include "cli-persistent.chart" . }}
{{ include "cli-persistent.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels
*/}}
{{- define "cli-persistent.selectorLabels" -}}
app.kubernetes.io/name: {{ include "cli-persistent.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Create a PriorityClassName.
(this is based on the Lagoon Environment Type)).
*/}}
{{- define "cli-persistent.lagoon-priority" -}}
{{- printf "lagoon-priority-%s" .Values.environmentType }}
{{- end -}}
