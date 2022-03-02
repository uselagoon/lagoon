package schema

// DeployEnvironmentLatestInput is used as the input for deploying an environment.
type DeployEnvironmentLatestInput struct {
	Environment    EnvironmentInput   `json:"environment"`
	BulkID         string             `json:"bulkId"`
	BulkName       string             `json:"bulkName"`
	Priority       int                `json:"priority"`
	BuildVariables []EnvKeyValueInput `json:"buildVariables"`
}

// EnvKeyValueInput  is based on the Lagoon API type.
type EnvKeyValueInput struct {
	Name  string `json:"name,omitempty"`
	Value string `json:"value,omitempty"`
}

// DeployEnvironmentLatest is the response.
type DeployEnvironmentLatest struct {
	DeployEnvironmentLatest string `json:"deployEnvironmentLatest"`
}
