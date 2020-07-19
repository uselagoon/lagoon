{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "lagoon-logging.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this
(by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "lagoon-logging.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "lagoon-logging.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "lagoon-logging.selectorLabels" -}}
app.kubernetes.io/name: {{ include "lagoon-logging.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "lagoon-logging.labels" -}}
helm.sh/chart: {{ include "lagoon-logging.chart" . }}
{{ include "lagoon-logging.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Create a default fully qualified app name for logs-dispatcher.
We truncate at 63 chars because some Kubernetes name fields are limited to this
(by the DNS naming spec).
*/}}
{{- define "lagoon-logging.logsDispatcher.fullname" -}}
{{- include "lagoon-logging.fullname" . }}-{{ .Values.logsDispatcher.name }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "lagoon-logging.logsDispatcher.selectorLabels" -}}
app.kubernetes.io/name: {{ include "lagoon-logging.name" . }}
app.kubernetes.io/component: {{ include "lagoon-logging.logsDispatcher.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "lagoon-logging.logsDispatcher.labels" -}}
helm.sh/chart: {{ include "lagoon-logging.chart" . }}
{{ include "lagoon-logging.logsDispatcher.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "lagoon-logging.logsDispatcher.serviceAccountName" -}}
{{- if .Values.logsDispatcher.serviceAccount.create }}
{{- default (include "lagoon-logging.logsDispatcher.fullname" .) .Values.logsDispatcher.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.logsDispatcher.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create a default fully qualified app name for logs-tee-router
We truncate at 63 chars because some Kubernetes name fields are limited to this
(by the DNS naming spec).
*/}}
{{- define "lagoon-logging.logsTeeRouter.fullname" -}}
{{- include "lagoon-logging.fullname" . }}-{{ .Values.logsTeeRouter.name }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "lagoon-logging.logsTeeRouter.selectorLabels" -}}
app.kubernetes.io/name: {{ include "lagoon-logging.name" . }}
app.kubernetes.io/component: {{ include "lagoon-logging.logsTeeRouter.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "lagoon-logging.logsTeeRouter.labels" -}}
helm.sh/chart: {{ include "lagoon-logging.chart" . }}
{{ include "lagoon-logging.logsTeeRouter.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "lagoon-logging.logsTeeRouter.serviceAccountName" -}}
{{- if .Values.logsTeeRouter.serviceAccount.create }}
{{- default (include "lagoon-logging.logsTeeRouter.fullname" .) .Values.logsTeeRouter.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.logsTeeRouter.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create a default fully qualified app name for logs-tee-application
We truncate at 63 chars because some Kubernetes name fields are limited to this
(by the DNS naming spec).
*/}}
{{- define "lagoon-logging.logsTeeApplication.fullname" -}}
{{- include "lagoon-logging.fullname" . }}-{{ .Values.logsTeeApplication.name }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "lagoon-logging.logsTeeApplication.selectorLabels" -}}
app.kubernetes.io/name: {{ include "lagoon-logging.name" . }}
app.kubernetes.io/component: {{ include "lagoon-logging.logsTeeApplication.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "lagoon-logging.logsTeeApplication.labels" -}}
helm.sh/chart: {{ include "lagoon-logging.chart" . }}
{{ include "lagoon-logging.logsTeeApplication.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "lagoon-logging.logsTeeApplication.serviceAccountName" -}}
{{- if .Values.logsTeeApplication.serviceAccount.create }}
{{- default (include "lagoon-logging.logsTeeApplication.fullname" .) .Values.logsTeeApplication.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.logsTeeApplication.serviceAccount.name }}
{{- end }}
{{- end }}
