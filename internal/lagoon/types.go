package lagoon

import (
	"github.com/uselagoon/machinery/api/schema"
)

type DeployData struct {
	GitType                  string               `json:"gitType"`
	BuildName                string               `json:"buildName"`
	BuildVariables           []schema.EnvKeyValue `json:"buildVariables"`
	BuildPriority            *uint                `json:"buildPriority"`
	BulkID                   string               `json:"bulkId"`
	BulkName                 string               `json:"bulkName"`
	BulkType                 BulkType             `json:"bulkType"`
	SourceUser               string               `json:"sourceUser"`
	SourceType               SourceType           `json:"sourceType"`
	UnsafeEnvironmentName    string               `json:"unsafeEnvironmentName"`
	Project                  schema.Project       `json:"project"`
	DeployTarget             schema.DeployTarget  `json:"deployTarget"`
	GitSHA                   string               `json:"gitSha"`
	DeployType               schema.DeployType    `json:"deployType"`
	PromoteSourceEnvironment string               `json:"promoteSourceEnvironment"`
	Pullrequest              Pullrequest          `json:"pullrequest"`
}

type Pullrequest struct {
	Title      string `json:"title"`
	Number     int    `json:"number"`
	BaseBranch string `json:"baseBranch"`
	BaseSha    string `json:"baseSha"`
	HeadBranch string `json:"headBranch"`
	HeadSha    string `json:"headSha"`
}

type BulkType string

const (
	BulkDeploy BulkType = "DEPLOY"
	BulkTask   BulkType = "TASK"
)

type SourceType string

const (
	SourceWebhook SourceType = "WEBHOOK"
	SourceAPI     SourceType = "API"
)

type BuildMetaData struct {
	Name      string
	Namespace string
}
type RemoveData struct {
	ProjectName string `json:"projectName"`
	// @TODO: send this now so that phased upgrade of remote-controller can be done while `branch` is still sent
	EnvironmentName string `json:"environmentName"`
	// @TODO: deprecate `branch` once remote-controller is updated to use this https://github.com/uselagoon/remote-controller/blob/v0.25.0/internal/messenger/consumer.go#L118-L124
	Branch                           string `json:"branch"`
	ForceDeleteProductionEnvironment bool   `json:"forceDeleteProductionEnvironment"`
}
