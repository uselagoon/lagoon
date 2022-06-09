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
lagoon.sh/service: {{ .Release.Name }}
lagoon.sh/service-type: {{ .Chart.Name }}
lagoon.sh/project: {{ .Values.project }}
lagoon.sh/environment: {{ .Values.environment }}
lagoon.sh/environmentType: {{ .Values.environmentType }}
lagoon.sh/buildType: {{ .Values.buildType }}
{{- end -}}

{{/*
Annotations
*/}}
{{- define "custom-ingress.annotations" -}}
lagoon.sh/version: {{ .Values.lagoonVersion | quote }}
{{- if .Values.branch }}
lagoon.sh/branch: {{ .Values.branch | quote }}
{{- end }}
{{- if .Values.prNumber }}
lagoon.sh/prNumber: {{ .Values.prNumber | quote }}
lagoon.sh/prHeadBranch: {{ .Values.prHeadBranch | quote }}
lagoon.sh/prBaseBranch: {{ .Values.prBaseBranch | quote }}
{{- end }}
{{- end -}}
