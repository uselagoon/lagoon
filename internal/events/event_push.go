package events

import (
	"fmt"
	"strings"

	"github.com/drone/go-scm/scm"
	"github.com/uselagoon/lagoon/internal/lagoon"
	"github.com/uselagoon/machinery/api/schema"
)

func (e *Events) HandlePush(gitType, event, uuid string, scmWebhook *scm.PushHook) ([]Response, error) {
	var projects []schema.Project
	var bulkID, bulkName string
	var err error
	matched := false
	if scmWebhook.Repo.CloneSSH != "" {
		projects, bulkID, bulkName, err = e.findProjectsByGitURL(gitType, event, uuid, scmWebhook.Repo.CloneSSH)
		if err != nil {
			return nil, err
		}
		if len(projects) > 0 {
			matched = true
		}
	}
	if scmWebhook.Repo.Clone != "" && !matched {
		projects, bulkID, bulkName, err = e.findProjectsByGitURL(gitType, event, uuid, scmWebhook.Repo.Clone)
		if err != nil {
			return nil, err
		}
	}
	if len(projects) == 0 {
		return nil, fmt.Errorf("no matching project found")
	}

	// github deletions are via "push" events AND if configured "branch deletion" events
	// for backwards compatability we have to do this hack since drone-scm doesn't acknowledge that deletions via push events
	// are legitimate
	// since most people probably only have "push" events enabled in github and not "branch delete" or "branch create" as our documentation states to configure
	// if users had both enabled, two events are sent from github
	// this wouldn't be bad necessarily, just one of the deletions would possibly "fail"
	// instead we can just ignore the github "branch delete" and "branch" create webhooks in the branch.go code
	deletion := false
	if gitType == "github" && scmWebhook.After == "0000000000000000000000000000000000000000" {
		deletion = true
	}
	if strings.Contains(scmWebhook.Ref, "refs/tags/") {
		return nil, fmt.Errorf("skipped contains tags")
	}

	branchName := strings.ReplaceAll(scmWebhook.Ref, "refs/heads/", "")
	sourceUser := "webhook"
	if scmWebhook.Sender.Login != "" {
		sourceUser = scmWebhook.Sender.Login
	}
	skip := skipDeploy(scmWebhook.Commit.Message)
	if skip {
		return nil, fmt.Errorf("skipped by skip commit message")
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
		if deletion {
			err = e.CreateRemoveTask(project, branchName, false)
		} else {
			deployData := lagoon.DeployData{
				GitType:               gitType,
				BuildName:             buildName,
				UnsafeEnvironmentName: branchName,
				SourceUser:            sourceUser,
				Project:               project,
				SourceType:            lagoon.SourceWebhook,
				DeployType:            schema.Branch,
				BulkType:              lagoon.BulkDeploy,
				GitSHA:                scmWebhook.After,
			}
			if bulkID != "" {
				deployData.BulkID = bulkID
				deployData.BulkName = bulkName
			}
			resp, err = e.CreateDeployTask(project, deployData)
		}
		if err != nil {
			errs++
			response.Error = err
		}
		response.Response = string(resp)
		resps = append(resps, response)
	}
	if errs > 0 {
		return resps, fmt.Errorf("")
	}
	return resps, nil
}
