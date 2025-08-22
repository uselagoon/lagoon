package lagoon

import (
	"github.com/drone/go-scm/scm"
	"github.com/uselagoon/machinery/api/schema"
)

type EnvVar struct {
	ID    uint   `json:"id,omitempty"`
	Scope string `json:"scope"`
	Name  string `json:"name"`
	Value string `json:"value"`
}

type DeployData struct {
	GitType                  string              `json:"gitType"`
	BuildName                string              `json:"buildName"`
	BuildVariables           []EnvVar            `json:"buildVariables"`
	BuildPriority            *uint               `json:"buildPriority"`
	BulkID                   string              `json:"bulkId"`
	BulkName                 string              `json:"bulkName"`
	BulkType                 BulkType            `json:"bulkType"`
	SourceUser               string              `json:"sourceUser"`
	SourceType               SourceType          `json:"sourceType"`
	UnsafeEnvironmentName    string              `json:"unsafeEnvironmentName"`
	Project                  schema.Project      `json:"project"`
	DeployTarget             schema.DeployTarget `json:"deployTarget"`
	GitSHA                   string              `json:"gitSha"`
	DeployType               schema.DeployType   `json:"deployType"`
	PromoteSourceEnvironment string              `json:"promoteSourceEnvironment"`
	Push                     *scm.PushHook
	Pull                     *scm.PullRequestHook
}

type BulkType string

const (
	BulkDeploy BulkType = "DEPLOY"
	BulkTask   BulkType = "TASK"
)

type SourceType string

const (
	SourceWebhook SourceType = "WEBHOOK"
	SourceAPI     BulkType   = "API"
)

type BuildMetaData struct {
	Name      string
	Namespace string
}
type RemoveData struct {
	ProjectName                      string `json:"projectName"`
	Type                             string `json:"type"`
	ForceDeleteProductionEnvironment bool   `json:"forceDeleteProductionEnvironment"`
	Branch                           string `json:"branch"`
	BranchName                       string `json:"branchName"`
	OpenshiftProjectName             string `json:"openshiftProjectName"`
}
