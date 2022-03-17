package schema

// DeployEnvironmentLatestInput is used as the input for deploying an environment.
type DeployEnvironmentLatestInput struct {
	Environment EnvironmentInput `json:"environment"`
	BulkID      string           `json:"bulkId"`
	Priority    int              `json:"priority"`
}

// DeployEnvironmentLatest is the response.
type DeployEnvironmentLatest struct {
	DeployEnvironmentLatest string `json:"deployEnvironmentLatest"`
}
