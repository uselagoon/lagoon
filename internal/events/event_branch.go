package events

import (
	"fmt"
	"strings"

	"github.com/drone/go-scm/scm"
	"github.com/uselagoon/lagoon/internal/lagoon"
	"github.com/uselagoon/machinery/api/schema"
)

func (e *Events) HandleBranch(gitType, event, uuid string, scmWebhook *scm.BranchHook) ([]Response, error) {
	// branchName := strings.ReplaceAll(scmWebhook.Ref.Name, "refs/heads/", "")
	// log.Println(
	// 	"branch", ":",
	// 	gitType, ":",
	// 	event, ":",
	// 	uuid, ":",
	// 	scmWebhook.Action, ":",
	// 	scmWebhook.Repo.Clone, ":",
	// 	scmWebhook.Repo.CloneSSH, ":",
	// 	branchName, ":",
	// 	scmWebhook.Repo.Namespace, ":",
	// 	scmWebhook.Repo.Name, ":",
	// 	scmWebhook.Sender.Login,
	// )

	// github deletions are via "push" events AND if configured "branch deletion" events
	// for backwards compatability we have to do this hack since drone-scm doesn't acknowledge that deletions via push events
	// are legitimate
	// since most people probably only have "push" events enabled in github and not "branch delete" or "branch create" as our documentation states to configure
	// if users had both enabled, two events are sent from github
	// this wouldn't be bad necessarily, just one of the deletions would possibly "fail"
	// instead we can just ignore the github "branch delete" and "branch" create webhooks
	if gitType == "github" {
		return nil, fmt.Errorf("skipped %v unsupported", scmWebhook)
	}

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

	branchName := strings.ReplaceAll(scmWebhook.Ref.Name, "refs/heads/", "")
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
		if scmWebhook.Action == scm.ActionDelete || scmWebhook.Action == scm.ActionClose {
			resp, err = e.CreateRemoveTask(project, branchName)
		} else {
			deployData := lagoon.DeployData{
				BuildName:             buildName,
				UnsafeEnvironmentName: branchName,
				SourceUser:            sourceUser,
				Project:               project,
				SourceType:            lagoon.SourceWebhook,
				DeployType:            schema.Branch,
				BulkType:              lagoon.BulkDeploy,
				GitSHA:                scmWebhook.Ref.Sha,
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
		return resps, fmt.Errorf("nothing to do")
	}
	return resps, nil
}
