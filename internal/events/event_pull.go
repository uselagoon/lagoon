package events

import (
	"fmt"

	"github.com/drone/go-scm/scm"
	"github.com/uselagoon/lagoon/internal/lagoon"
	"github.com/uselagoon/machinery/api/schema"
)

func (e *Events) HandlePull(gitType, event, uuid string, scmWebhook *scm.PullRequestHook) ([]Response, error) {
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
			err = e.CreateRemoveTask(project, fmt.Sprintf("pr-%d", scmWebhook.PullRequest.Number))
		} else {
			deployData := lagoon.DeployData{
				GitType:               gitType,
				BuildName:             buildName,
				UnsafeEnvironmentName: fmt.Sprintf("pr-%d", scmWebhook.PullRequest.Number),
				SourceUser:            sourceUser,
				Project:               project,
				SourceType:            lagoon.SourceWebhook,
				DeployType:            schema.PullRequest,
				BulkType:              lagoon.BulkDeploy,
				GitSHA:                "",
				Pullrequest: lagoon.Pullrequest{
					Number:     scmWebhook.PullRequest.Number,
					Title:      scmWebhook.PullRequest.Title,
					BaseBranch: scmWebhook.PullRequest.Target,
					BaseSha:    scmWebhook.PullRequest.Base.Sha,
					HeadBranch: scmWebhook.PullRequest.Source,
					HeadSha:    scmWebhook.PullRequest.Sha,
				},
			}
			switch deployData.GitType {
			case "gogs":
				// would need to verify. lagoon doesn't support gogs officially
				// the gogs pr payloads don't contain the shas like others do
				deployData.Pullrequest.BaseSha = fmt.Sprintf("origin/%s", scmWebhook.PullRequest.Target)
				deployData.Pullrequest.HeadSha = fmt.Sprintf("origin/%s", scmWebhook.PullRequest.Source)
			case "gitlab":
				// gitlab does not send us the target sha, we just use the target_branch
				deployData.Pullrequest.BaseSha = fmt.Sprintf("origin/%s", scmWebhook.PullRequest.Target)
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
