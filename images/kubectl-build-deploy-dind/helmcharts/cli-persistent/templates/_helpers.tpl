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
{{ include "cli-persistent.lagoonLabels" . }}

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
{{- define "cli-persistent.lagoonPriority" -}}
{{- printf "lagoon-priority-%s" .Values.environmentType }}
{{- end -}}

{{/*
Lagoon Labels
*/}}
{{- define "cli-persistent.lagoonLabels" -}}
lagoon/service: {{ .Release.Name }}
lagoon/service-type: {{ .Chart.Name }}
lagoon/project: {{ .Values.project }}
lagoon/environment: {{ .Values.environment }}
lagoon/environmentType: {{ .Values.environmentType }}
lagoon/buildType: {{ .Values.buildType }}
{{- end -}}

{{/*
Annotations
*/}}
{{- define "cli-persistent.annotations" -}}
lagoon/version: {{ .Values.lagoonVersion | quote }}
{{- if .Values.branch }}
lagoon/branch: {{ .Values.branch | quote }}
{{- end }}
{{- if .Values.prNumber }}
lagoon/prNumber: {{ .Values.prNumber | quote }}
lagoon/prHeadBranch: {{ .Values.prHeadBranch | quote }}
lagoon/prBaseBranch: {{ .Values.prBaseBranch | quote }}
{{- end }}
{{- end -}}