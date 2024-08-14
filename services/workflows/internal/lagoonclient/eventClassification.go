package lagoonclient

var Events = map[string][]string{
	"mergeRequestOpened": []string{
		"github:pull_request:opened:handled",
		"gitlab:merge_request:opened:handled",
		"bitbucket:pullrequest:created:opened:handled",
		"bitbucket:pullrequest:created:handled",
	},
	"mergeRequestUpdated": []string{
		"github:pull_request:synchronize:handled",
		"gitlab:merge_request:updated:handled",
		"bitbucket:pullrequest:updated:opened:handled",
		"bitbucket:pullrequest:updated:handled",
	},
	"mergeRequestClosed": []string{
		"github:pull_request:closed:handled",
		"bitbucket:pullrequest:fulfilled:handled",
		"bitbucket:pullrequest:rejected:handled",
		"gitlab:merge_request:closed:handled",
	},
	"deleteEnvironment": []string{
		"github:delete:handled",
		"gitlab:remove:handled",
		"bitbucket:delete:handled",
		"api:deleteEnvironment",
	},
	"repoPushHandled": []string{
		"github:push:handled",
		"bitbucket:repo:push:handled",
		"gitlab:push:handled",
	},
	"repoPushSkipped": []string{
		"github:push:skipped",
		"gitlab:push:skipped",
		"bitbucket:push:skipped",
	},
	"deployEnvironment": []string{
		"api:deployEnvironmentLatest",
		"api:deployEnvironmentBranch",
	},
	"deployFinished": []string{
		"task:deploy-openshift:finished",
		"task:remove-openshift-resources:finished",
		"task:builddeploy-openshift:complete",
		"task:builddeploy-kubernetes:complete",
	},
	"removeFinished": []string{
		"task:remove-openshift:finished",
		"task:remove-kubernetes:finished",
	},
	"deployError": []string{
		"task:remove-openshift:error",
		"task:remove-kubernetes:error",
		"task:builddeploy-kubernetes:failed",
		"task:builddeploy-openshift:failed",
	},
	"notDeleted": []string{
		"github:pull_request:closed:CannotDeleteProductionEnvironment",
		"github:push:CannotDeleteProductionEnvironment",
		"bitbucket:repo:push:CannotDeleteProductionEnvironment",
		"gitlab:push:CannotDeleteProductionEnvironment",
	},
	"testing": []string{
		"testing",
	},
}

func IsEventOfType(eventName string, eventType string) bool {
	if eventTypes, ok := Events[eventType]; ok {
		for _, a := range eventTypes {
			if a == eventName {
				return true
			}
		}
	}
	return false
}
