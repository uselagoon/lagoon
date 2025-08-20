package events

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/drone/go-scm/scm"
	"github.com/uselagoon/lagoon/services/webhooks/internal/lagoon"
	"github.com/uselagoon/machinery/api/schema"
)

var buildNameSeed = buildSeed()

func buildSeed() int64 {
	return time.Now().UnixNano()
}

func (e *Events) HandlePush(gitType, event, uuid string, scmWebhook *scm.PushHook) ([]byte, error) {
	var projects []schema.Project
	var bulkID, bulkName string
	var err error
	matched := false
	if scmWebhook.Repo.CloneSSH != "" {
		projects, bulkID, bulkName, err = e.findProjectsByGitURL(gitType, event, uuid, scmWebhook.Repo.CloneSSH)
		if err != nil {
			return nil, fmt.Errorf("skipped %v", err)
		}
		if len(projects) > 0 {
			matched = true
		}
	}
	if scmWebhook.Repo.Clone != "" && !matched {
		projects, bulkID, bulkName, err = e.findProjectsByGitURL(gitType, event, uuid, scmWebhook.Repo.Clone)
		if err != nil {
			return nil, fmt.Errorf("skipped %v", err)
		}
	}
	if len(projects) == 0 {
		e.Messaging.Publish("lagoon-logs", []byte("skipped"))
		return nil, fmt.Errorf("skipped")
	}

	// github deletions are via "push" events AND if configured "branch deletion" events
	// for backwards compatability we have to do this hack since drone-scm doesn't acknowledge that deletions via push events
	// are legitimate
	// since most people probably only have "push" events enabled in github and not "branch delete" or "branch create" as our documentation states to configure
	// if users had both enabled, two events are sent from github
	// this wouldn't be bad necessarily, just one of the deletions would possibly "fail"
	// instead we can just ignore the github "branch delete" and "branch" create webhooks in the branch.go code
	if gitType == "github" && scmWebhook.After == "0000000000000000000000000000000000000000" {
		return []byte("delete me"), nil
	}
	environmentName := strings.ReplaceAll(scmWebhook.Ref, "refs/heads/", "")
	buildName := lagoon.GenerateBuildName(buildNameSeed)
	sourceUser := "webhook"
	if scmWebhook.Sender.Login != "" {
		sourceUser = scmWebhook.Sender.Login
	}
	skip := skipDeploy(scmWebhook.Commit.Message)
	if skip {
		e.Messaging.Publish("lagoon-logs", []byte("skipped"))
		return nil, fmt.Errorf("skipped")
	}

	var resps []Response
	errs := 0
	for _, project := range projects {
		response := Response{
			Project: project.Name,
		}
		resp, err := e.createDeployTask(project, "push", environmentName, buildName, sourceUser, bulkID, bulkName)
		if err != nil {
			errs++
			response.Error = err
		}
		response.Response = resp
		resps = append(resps, response)
	}
	respBytes, _ := json.Marshal(resps)
	if errs > 0 {
		return respBytes, fmt.Errorf("nothing to do")
	}
	return respBytes, nil
}
