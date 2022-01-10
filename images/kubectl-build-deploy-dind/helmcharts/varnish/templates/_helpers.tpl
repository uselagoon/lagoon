{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "varnish.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "varnish.fullname" -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "varnish.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create full hostname for autogenerated hosts
*/}}
{{- define "varnish.autogeneratedHost" -}}
{{- if .root.Values.autogeneratedRouteDomain -}}
{{ if not .prefix }}
{{- printf "%s" .root.Values.autogeneratedRouteDomain | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s.%s" .prefix .root.Values.autogeneratedRouteDomain | trimSuffix "-" -}}
{{- end -}}
{{- else -}}
{{ if not .prefix }}
{{- printf "%s.%s" .root.Release.Name .root.Values.routesAutogenerateSuffix | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s.%s.%s" .prefix .root.Release.Name .root.Values.routesAutogenerateSuffix | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create short hostname for autogenerated hosts.
This is used to work around problems with long CN fields in certificates.
*/}}
{{- define "varnish.autogeneratedShortHost" -}}
{{- if .root.Values.shortAutogeneratedRouteDomain -}}
{{- printf "%s" .root.Values.shortAutogeneratedRouteDomain }}
{{- else -}}
{{- printf "%s.%s" .root.Release.Name .root.Values.routesAutogenerateShortSuffix }}
{{- end -}}
{{- end }}

{{/*
Common labels
*/}}
{{- define "varnish.labels" -}}
helm.sh/chart: {{ include "varnish.chart" . }}
{{ include "varnish.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{ include "varnish.lagoonLabels" . }}
{{- end -}}

{{/*
Selector labels
*/}}
{{- define "varnish.selectorLabels" -}}
app.kubernetes.io/name: {{ include "varnish.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Create a PriorityClassName.
(this is based on the Lagoon Environment Type)).
*/}}
{{- define "varnish.lagoonPriority" -}}
{{- printf "lagoon-priority-%s" .Values.environmentType }}
{{- end -}}

{{/*
Lagoon Labels
*/}}
{{- define "varnish.lagoonLabels" -}}
lagoon.sh/service: {{ .Release.Name }}
lagoon.sh/service-type: {{ .Chart.Name }}
lagoon.sh/project: {{ .Values.project }}
lagoon.sh/environment: {{ .Values.environment }}
lagoon.sh/environmentType: {{ .Values.environmentType }}
lagoon.sh/buildType: {{ .Values.buildType }}
{{- end -}}

{{/*
Datadog Admission Controller label
*/}}
{{- define "varnish.datadogLabels" -}}
{{- if eq .Values.environmentType "production" -}}
admission.datadoghq.com/enabled: "true"
{{- end -}}
{{- end -}}

{{/*
Annotations
*/}}
{{- define "varnish.annotations" -}}
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
