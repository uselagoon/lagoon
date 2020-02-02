{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "custom-ingress.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "custom-ingress.fullname" -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}


{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "custom-ingress.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "custom-ingress.labels" -}}
helm.sh/chart: {{ include "custom-ingress.chart" . }}
{{ include "custom-ingress.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{ include "custom-ingress.lagoonLabels" . }}

{{- end -}}

{{/*
Selector labels
*/}}
{{- define "custom-ingress.selectorLabels" -}}
app.kubernetes.io/name: {{ include "custom-ingress.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Lagoon Labels
*/}}
{{- define "custom-ingress.lagoonLabels" -}}
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
{{- define "custom-ingress.annotations" -}}
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