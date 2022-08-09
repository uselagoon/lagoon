{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "varnish-persistent.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "varnish-persistent.fullname" -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "varnish-persistent.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create full hostname for autogenerated hosts
*/}}
{{- define "varnish-persistent.autogeneratedHost" -}}
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
{{- define "varnish-persistent.autogeneratedShortHost" -}}
{{- if .root.Values.shortAutogeneratedRouteDomain -}}
{{- printf "%s" .root.Values.shortAutogeneratedRouteDomain }}
{{- else -}}
{{- printf "%s.%s" .root.Release.Name .root.Values.routesAutogenerateShortSuffix }}
{{- end -}}
{{- end }}

{{/*
Generate name of Persistent Storage
Uses the Release Name (Lagoon Service Name) unless it's overwritten via .Values.persistentStorage.name
*/}}
{{- define "varnish-persistent.persistentStorageName" -}}
{{- default .Release.Name .Values.persistentStorage.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "varnish-persistent.labels" -}}
helm.sh/chart: {{ include "varnish-persistent.chart" . }}
{{ include "varnish-persistent.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{ include "varnish-persistent.lagoonLabels" . }}
{{- end -}}

{{/*
Selector labels
*/}}
{{- define "varnish-persistent.selectorLabels" -}}
app.kubernetes.io/name: {{ include "varnish-persistent.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Create a PriorityClassName.
(this is based on the Lagoon Environment Type)).
*/}}
{{- define "varnish-persistent.lagoonPriority" -}}
{{- printf "lagoon-priority-%s" .Values.environmentType }}
{{- end -}}

{{/*
Lagoon Labels
*/}}
{{- define "varnish-persistent.lagoonLabels" -}}
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
{{- define "varnish-persistent.datadogLabels" -}}
{{- if eq .Values.environmentType "production" -}}
admission.datadoghq.com/enabled: "true"
{{- end -}}
{{- end -}}

{{/*
Annotations
*/}}
{{- define "varnish-persistent.annotations" -}}
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
