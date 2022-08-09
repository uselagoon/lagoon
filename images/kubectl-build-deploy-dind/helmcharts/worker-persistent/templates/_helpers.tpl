{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "worker-persistent.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "worker-persistent.fullname" -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "worker-persistent.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "worker-persistent.labels" -}}
helm.sh/chart: {{ include "worker-persistent.chart" . }}
{{ include "worker-persistent.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{ include "worker-persistent.lagoonLabels" . }}
{{- end -}}

{{/*
Selector labels
*/}}
{{- define "worker-persistent.selectorLabels" -}}
app.kubernetes.io/name: {{ include "worker-persistent.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Create a PriorityClassName.
(this is based on the Lagoon Environment Type)).
*/}}
{{- define "worker-persistent.lagoonPriority" -}}
{{- printf "lagoon-priority-%s" .Values.environmentType }}
{{- end -}}

{{/*
Lagoon Labels
*/}}
{{- define "worker-persistent.lagoonLabels" -}}
lagoon.sh/service: {{ .Release.Name }}
lagoon.sh/service-type: {{ .Chart.Name }}
lagoon.sh/project: {{ .Values.project }}
lagoon.sh/environment: {{ .Values.environment }}
lagoon.sh/environmentType: {{ .Values.environmentType }}
lagoon.sh/buildType: {{ .Values.buildType }}
{{- if .Values.useSpot }}
lagoon.sh/spot: {{ .Values.useSpot | quote }}
{{- end }}
{{- end -}}

{{/*
Datadog Admission Controller label
*/}}
{{- define "worker-persistent.datadogLabels" -}}
{{- if eq .Values.environmentType "production" -}}
admission.datadoghq.com/enabled: "true"
{{- end -}}
{{- end -}}

{{/*
Annotations
*/}}
{{- define "worker-persistent.annotations" -}}
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

{{/*
Generate name for twig storage emptyDir
*/}}
{{- define "worker-persistent.twig-storage.name" -}}
{{- printf "%s-twig" .Values.persistentStorage.name }}
{{- end -}}

{{/*
Generate path for twig storage emptyDir
*/}}
{{- define "worker-persistent.twig-storage.path" -}}
{{- printf "%s/php" .Values.persistentStorage.path }}
{{- end -}}
