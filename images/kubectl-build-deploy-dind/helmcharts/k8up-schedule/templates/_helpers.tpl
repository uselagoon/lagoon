{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "k8up-schedule.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "k8up-schedule.fullname" -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "k8up-schedule.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "k8up-schedule.labels" -}}
helm.sh/chart: {{ include "k8up-schedule.chart" . }}
{{ include "k8up-schedule.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{ include "k8up-schedule.lagoonLabels" . }}

{{- end -}}

{{/*
Selector labels
*/}}
{{- define "k8up-schedule.selectorLabels" -}}
app.kubernetes.io/name: {{ include "k8up-schedule.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Lagoon Labels
*/}}
{{- define "k8up-schedule.lagoonLabels" -}}
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
{{- define "k8up-schedule.annotations" -}}
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