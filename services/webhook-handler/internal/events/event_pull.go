package events

import (
	"encoding/json"
	"fmt"

	"github.com/drone/go-scm/scm"
	"github.com/uselagoon/lagoon/services/webhook-handler/internal/lagoon"
	"github.com/uselagoon/machinery/api/schema"
)

func (e *Events) HandlePull(gitType, event, uuid string, scmWebhook *scm.PullRequestHook) ([]byte, error) {
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
		// do nothing, no matching projects found
		e.Messaging.Publish("lagoon-logs", []byte("skipped"))
		return nil, fmt.Errorf("skipped")
	}

	sourceUser := "webhook"
	if scmWebhook.Sender.Login != "" {
		sourceUser = scmWebhook.Sender.Login
	}

	var resps []Response
	errs := 0
	for _, project := range projects {
		response := Response{
			Project: project.Name,
		}
		var resp []byte
		var err error
		buildName := lagoon.GenerateBuildName()
		if scmWebhook.PullRequest.Closed || scmWebhook.Action == scm.ActionClose {
			resp, err = e.createRemoveTask(project, "pull", fmt.Sprintf("pr-%d", scmWebhook.PullRequest.Number))
		} else {
			deployData := lagoon.DeployData{
				GitType:               gitType,
				BuildName:             buildName,
				UnSafeEnvironmentName: fmt.Sprintf("pr-%d", scmWebhook.PullRequest.Number),
				SourceUser:            sourceUser,
				Project:               project,
				SourceType:            lagoon.SourceWebhook,
				DeployType:            schema.PullRequest,
				BulkType:              lagoon.BulkDeploy,
				GitSHA:                "",
				Pull:                  scmWebhook,
			}
			resp, err = e.createDeployTask(project, deployData, "pull", bulkID, bulkName)
		}
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
